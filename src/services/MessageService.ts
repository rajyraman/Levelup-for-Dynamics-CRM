// Centralized message service for Level Up extension
// This service provides a single point of control for all message communication

import { DynamicsAction } from '#types/global';

export interface MessageRequest {
  type: 'LEVELUP_REQUEST';
  action: DynamicsAction;
  data?: unknown;
  requestId?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  requestId?: string;
}

export class MessageService {
  private static instance: MessageService;
  private requestId = 0;
  private pendingRequests = new Map<string, (response: MessageResponse) => void>();
  // Handlers may optionally receive the chrome.runtime.MessageSender so
  // background handlers can use sender.tab to operate on the originating tab.
  private messageHandlers = new Map<
    DynamicsAction,
    (data?: unknown, sender?: chrome.runtime.MessageSender) => Promise<unknown>
  >();
  // When running in a service worker (background) messages can arrive
  // before handlers are registered. Buffer incoming LEVELUP_REQUEST messages
  // until the runtime signals that handlers are ready.
  private ready = false;
  private pendingIncomingRequests: Array<{
    message: any;
    sender: chrome.runtime.MessageSender;
    sendResponse: (response?: any) => void;
  }> = [];

  private constructor() {
    // Private constructor for singleton
    this.setupMessageListener();
  }

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Send a message and wait for response
   */
  public async sendMessage(action: DynamicsAction, data?: unknown): Promise<MessageResponse> {
    const requestId = `req_${++this.requestId}_${Date.now()}`;

    const message: MessageRequest = {
      type: 'LEVELUP_REQUEST',
      action,
      data,
      requestId,
    };

    console.log(`📤 [MessageService] Sending: ${action}`, { requestId, data });

    try {
      const response = (await chrome.runtime.sendMessage(message)) as MessageResponse;

      console.log(`📥 [MessageService] Response: ${action}`, {
        requestId,
        success: response?.success,
        error: response?.error,
      });

      return response || { success: false, error: 'No response received' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [MessageService] Error: ${action}`, { requestId, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        requestId,
      };
    }
  }

  /**
   * Send a message with typed response data
   */
  public async sendMessageTyped<T>(action: DynamicsAction, data?: unknown): Promise<T> {
    const response = await this.sendMessage(action, data);

    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }

    return response.data as T;
  }

  /**
   * Search for users - dedicated method similar to entity metadata
   */
  public async searchUsers(query: string): Promise<MessageResponse> {
    console.log('📤 [MessageService] Searching users with query:', query);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'SEARCH_USERS_REQUEST',
        query: query,
      })) as MessageResponse;

      console.log('📥 [MessageService] Search users response:', {
        success: response?.success,
        error: response?.error,
        dataLength:
          response?.data &&
          typeof response.data === 'object' &&
          'users' in response.data &&
          Array.isArray((response.data as any).users)
            ? (response.data as any).users.length
            : 'N/A',
      });

      return response || { success: false, error: 'No response received' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [MessageService] Search users error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get message statistics for debugging
   */
  public getStats() {
    return {
      totalRequests: this.requestId,
      pendingRequests: this.pendingRequests.size,
      registeredHandlers: this.messageHandlers.size,
      handlers: Array.from(this.messageHandlers.keys()),
    };
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  public clearPendingRequests() {
    this.pendingRequests.clear();
  }

  /**
   * Set up Chrome runtime message listener
   */
  private setupMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Handle GET_ENTITY_METADATA_REQUEST messages separately
        if (message.type === 'GET_ENTITY_METADATA_REQUEST') {
          this.handleGetEntitiesMessage(message, sender, sendResponse);
          return true;
        }

        // Handle SEARCH_USERS_REQUEST messages separately
        if (message.type === 'SEARCH_USERS_REQUEST') {
          this.handleSearchUsersMessage(message, sender, sendResponse);
          return true;
        }

        // Handle LEVELUP_REQUEST messages
        if (message.type === 'LEVELUP_REQUEST') {
          // If the service hasn't finished registering handlers (service worker
          // startup race), queue the incoming request and process it once
          // the background calls `setReady()`.
          if (!this.ready) {
            console.log(
              '📨 [MessageService] Queuing incoming request until ready:',
              message.action
            );
            this.pendingIncomingRequests.push({ message, sender, sendResponse });
            return true; // keep channel open until processed
          }

          this.handleIncomingMessage(message, sender, sendResponse);
          return true;
        }

        // Handle LEVELUP_RESPONSE messages forwarded from content script
        if (message.type === 'LEVELUP_RESPONSE') {
          this.handleResponseMessage(message);
          return false; // Don't keep the message channel open
        }

        // Handle SHOW_TOAST messages from content script
        if (message.type === 'SHOW_TOAST') {
          const toastMessage = message as {
            type: 'SHOW_TOAST';
            message: string;
            severity: 'success' | 'info' | 'warning' | 'error';
          };
          this.showToastNotification(toastMessage.message, toastMessage.severity);
          return false; // Don't keep the message channel open
        }

        return false; // Let other listeners handle other messages
      });
    }
  }

  /**
   * Mark the service as ready to process incoming LEVELUP_REQUEST messages.
   * Any queued requests will be processed in FIFO order.
   */
  public setReady() {
    this.ready = true;
    if (this.pendingIncomingRequests.length > 0) {
      console.log(
        `📨 [MessageService] Processing ${this.pendingIncomingRequests.length} queued incoming requests`
      );
      // Drain the queue
      const queued = this.pendingIncomingRequests.slice();
      this.pendingIncomingRequests.length = 0;
      for (const item of queued) {
        try {
          // Process each queued message asynchronously
          this.handleIncomingMessage(item.message, item.sender, item.sendResponse);
        } catch (e) {
          console.error('📨 [MessageService] Error processing queued message:', e);
          try {
            item.sendResponse({ success: false, error: 'Background failed to process message' });
          } catch {}
        }
      }
    }
  }

  /**
   * Handle GET_ENTITY_METADATA_REQUEST messages
   */
  private async handleGetEntitiesMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    console.log('📨 [MessageService] Received GET_ENTITY_METADATA_REQUEST request');

    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        console.log('📨 [MessageService] No active tab found');
        sendResponse({
          success: false,
          error: 'No active tab found',
        });
        return;
      }

      console.log(
        '📨 [MessageService] Forwarding GET_ENTITY_METADATA_REQUEST to tab:',
        currentTab.id
      );

      // Forward the entities request to the content script
      chrome.tabs.sendMessage(currentTab.id, message, response => {
        if (chrome.runtime.lastError) {
          console.error('📨 [MessageService] Error getting entities:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: 'Could not communicate with page. Make sure you are on a Dynamics 365 page.',
          });
        } else {
          console.log(
            '📨 [MessageService] GET_ENTITY_METADATA_REQUEST response from content script:',
            response
          );
          sendResponse(
            response || {
              success: false,
              error: 'No response from content script',
            }
          );
        }
      });
    } catch (error) {
      console.error('📨 [MessageService] Error in GET_ENTITY_METADATA_REQUEST handler:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle SEARCH_USERS_REQUEST messages
   */
  private async handleSearchUsersMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    console.log('📨 [MessageService] Received SEARCH_USERS_REQUEST request:', message);

    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        console.log('📨 [MessageService] No active tab found');
        sendResponse({
          success: false,
          error: 'No active tab found',
        });
        return;
      }

      console.log('📨 [MessageService] Forwarding SEARCH_USERS_REQUEST to tab:', currentTab.id);

      // Forward the search users request to the content script
      chrome.tabs.sendMessage(currentTab.id, message, response => {
        if (chrome.runtime.lastError) {
          console.error('📨 [MessageService] Error searching users:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: 'Could not communicate with page. Make sure you are on a Dynamics 365 page.',
          });
        } else {
          console.log(
            '📨 [MessageService] SEARCH_USERS_REQUEST response from content script:',
            response
          );
          sendResponse(
            response || {
              success: false,
              error: 'No response from content script',
            }
          );
        }
      });
    } catch (error) {
      console.error('📨 [MessageService] Error in SEARCH_USERS_REQUEST handler:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(
    message: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) {
    console.log(`📨 [MessageService] Received: ${message.action}`, {
      requestId: message.requestId,
      data: message.data,
      sender: sender.tab?.id,
    });

    try {
      if (message.type === 'LEVELUP_REQUEST' && message.action) {
        const handler = this.messageHandlers.get(message.action);

        if (handler) {
          const result = await handler(message.data, sender);
          const response: MessageResponse = {
            success: true,
            data: result,
            requestId: message.requestId,
          };

          console.log(`✅ [MessageService] Handled: ${message.action}`, {
            requestId: message.requestId,
            success: true,
          });

          sendResponse(response);
        } else {
          console.warn(`⚠️ [MessageService] No handler for: ${message.action}`, {
            requestId: message.requestId,
          });

          sendResponse({
            success: false,
            error: `No handler registered for action: ${message.action}`,
            requestId: message.requestId,
          });
        }
      } else {
        sendResponse({
          success: false,
          error: 'Invalid message format',
          requestId: message.requestId,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [MessageService] Handler error: ${message.action}`, {
        requestId: message.requestId,
        error: errorMessage,
      });

      sendResponse({
        success: false,
        error: errorMessage,
        requestId: message.requestId,
      });
    }
  }

  /**
   * Handle LEVELUP_RESPONSE messages forwarded from content script
   */
  private handleResponseMessage(message: any) {
    console.log('📨 [MessageService] Received LEVELUP_RESPONSE:', message);

    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      console.log('📨 [MessageService] Resolving pending request:', message.requestId);
      const resolver = this.pendingRequests.get(message.requestId);
      if (resolver) {
        resolver(message);
        this.pendingRequests.delete(message.requestId);
      }
    } else {
      console.log('📨 [MessageService] No pending request found for requestId:', message.requestId);

      // Handle unsolicited error responses (e.g., form context failures)
      // These should be displayed as toast notifications to the user
      if (message.success === false && message.error) {
        console.log('📨 [MessageService] Displaying unsolicited error as toast:', message.error);
        this.showToastNotification(message.error, 'error');
      }
    }
  }

  /**
   * Show toast notification in the sidebar
   * This method dispatches a custom event that the sidebar can listen to
   */
  private showToastNotification(
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error'
  ) {
    // Preferred: dispatch an in-page custom event so sidebars/popups can show toasts
    try {
      if (typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function') {
        const event = new CustomEvent('levelup-toast', {
          detail: { message, severity },
        });
        window.dispatchEvent(event);
        return;
      }
    } catch (e) {
      // ignore and try fallback
    }

    // Note: chrome.notifications requires declaring the notifications permission in the manifest.
    // We avoid adding that permission here. Fall back to sending a runtime message which
    // UI contexts (popup/sidebar) can handle when open.

    // Final fallback: send runtime message (may be handled by popup/sidebar when open)
    try {
      if (
        typeof chrome !== 'undefined' &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === 'function'
      ) {
        chrome.runtime.sendMessage({ type: 'SHOW_TOAST', message, severity });
      }
    } catch (e) {
      // give up silently
    }
  }

  /**
   * Register a handler for a specific action
   */
  public registerHandler(
    action: DynamicsAction,
    handler: (data?: unknown, sender?: chrome.runtime.MessageSender) => Promise<unknown>
  ) {
    console.log(`🔧 [MessageService] Registering handler for: ${action}`);
    this.messageHandlers.set(action, handler);
  }

  /**
   * Unregister a handler for a specific action
   */
  public unregisterHandler(action: DynamicsAction) {
    console.log(`🗑️ [MessageService] Unregistering handler for: ${action}`);
    this.messageHandlers.delete(action);
  }

  /**
   * Get all registered handlers
   */
  public getRegisteredHandlers(): DynamicsAction[] {
    return Array.from(this.messageHandlers.keys());
  }
}

// Export singleton instance
export const messageService = MessageService.getInstance();
