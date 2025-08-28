// Content script that runs on Dynamics 365 pages
/// <reference types="xrm" />

import { ActionMessage, DynamicsResponse } from '#types/global';

// Message types used by the content script and injected script
interface SessionMessage {
  type: 'SET_SESSION_KEY' | 'GET_SESSION_KEY' | 'CLEAR_SESSION_KEY';
  sessionKey?: string;
}

interface MetadataMessage {
  type: 'GET_ENTITY_METADATA_REQUEST';
}

interface UserSearchMessage {
  type: 'SEARCH_USERS_REQUEST';
  query?: string;
}

interface PageContextMessage {
  type: 'GET_PAGE_CONTEXT';
}

type ContentScriptMessage =
  | ActionMessage
  | SessionMessage
  | MetadataMessage
  | UserSearchMessage
  | PageContextMessage;

interface ContentScriptResponse extends DynamicsResponse {
  sessionKey?: string;
  pageContext?: unknown;
}

class ContentScript {
  private injectedScript: HTMLScriptElement | null = null;
  private sessionKey: string | null = null;

  constructor() {
    // debug: print hostname so we can see where the content script runs
    // eslint-disable-next-line no-console
    console.debug('Level Up: content script starting on host', window.location.hostname);
    this.init().catch(error => {
      // eslint-disable-next-line no-console
      console.error('Level Up: Failed to initialize content script:', error);
    });
  }

  private async init(): Promise<void> {
    // Always setup message listener so sidebar can communicate
    this.setupMessageListener();
    this.loadSessionKey();

    // Check if we're on a Dynamics 365 page
    const isDynamicsPage = await this.isDynamics365Page();

    if (isDynamicsPage) {
      // Only inject script and activate features if we're on a Dynamics page
      this.injectScript();
    } else {
      // eslint-disable-next-line no-console
      console.debug(
        'Level Up: Not a Dynamics 365 page, content script available for sidebar communication only'
      );
    }
  }

  private loadSessionKey(): void {
    // Try to restore session key from sessionStorage
    const storedSessionKey = sessionStorage.getItem('levelup_session_key');
    if (storedSessionKey) {
      this.sessionKey = storedSessionKey;
    }
  }

  private saveSessionKey(sessionKey: string): void {
    this.sessionKey = sessionKey;
    sessionStorage.setItem('levelup_session_key', sessionKey);
  }

  private async isDynamics365Page(): Promise<boolean> {
    // Method 1: Check for Xrm.Utility.getGlobalContext()
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (typeof window !== 'undefined' && win.Xrm?.Utility?.getGlobalContext) {
        const version = win.Xrm.Utility.getGlobalContext().getVersion();
        if (version && version.startsWith('9.')) {
          return true;
        }
      }
    } catch (error) {
      // Continue with other checks if Xrm check fails
    }

    // Method 2: Check for Dynamics 365 specific script tags
    try {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const hasDynamicsScript = scripts.some(script => {
        const src = (script as HTMLScriptElement).src;
        return (
          src.indexOf('/uclient/scripts') !== -1 ||
          src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
          src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
        );
      });

      if (hasDynamicsScript) {
        return true;
      }
    } catch (error) {
      // Continue if script detection fails
    }

    return false;
  }

  private injectScript(): void {
    // Wait for page to be fully loaded before injecting the script
    const injectWhenReady = () => {
      const script = document.createElement('script');
      script.id = 'levelup-extension-script';
      script.src = chrome.runtime.getURL('levelup-extension.js');
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // eslint-disable-next-line no-console
        console.log('Level Up: Extension script loaded successfully');
        script.remove();
      };

      script.onerror = error => {
        // eslint-disable-next-line no-console
        console.error('Level Up: Failed to load extension script', error);
      };

      (document.head || document.documentElement).appendChild(script);
      this.injectedScript = script;
    };

    // Ensure DOM is ready before injecting
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectWhenReady);
    } else {
      // If DOM is already ready, inject immediately
      injectWhenReady();
    }
  }

  private setupMessageListener(): void {
    // Listen for messages from the extension - unified message handler
    chrome.runtime.onMessage.addListener(
      (
        message: ContentScriptMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: ContentScriptResponse) => void
      ) => {
        // Unified message routing based on type
        const isAsync = this.routeMessage(message, sendResponse);
        return isAsync; // Keep the message channel open for async responses
      }
    );

    // Listen for messages from the injected script
    window.addEventListener('message', event => {
      if (event.source !== window) {
        return;
      }

      if (event.data.type === 'LEVELUP_RESPONSE') {
        chrome.runtime.sendMessage(event.data);
        // Response received from injected script
      }
    });
  }

  private handleDynamicsAction(
    message: ActionMessage,
    sendResponse: (response: DynamicsResponse) => void
  ): void {
    const requestId = Date.now().toString();

    // Forward the action to the injected script
    window.postMessage(
      {
        type: 'LEVELUP_REQUEST',
        action: message.action,
        data: message.data,
        requestId: requestId,
      },
      window.location.origin
    );

    // Set up a one-time listener for the response
    const responseListener = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      if (event.data.type === 'LEVELUP_RESPONSE' && event.data.requestId === requestId) {
        window.removeEventListener('message', responseListener);
        sendResponse(event.data);
      }
    };

    window.addEventListener('message', responseListener);
  }

  private routeMessage(
    message: ContentScriptMessage,
    sendResponse: (response: ContentScriptResponse) => void
  ): boolean {
    // Route message based on type
    switch (message.type) {
      case 'LEVELUP_REQUEST':
        this.handleDynamicsAction(message as ActionMessage, sendResponse);
        return true;

      case 'GET_ENTITY_METADATA_REQUEST':
        this.handleMetadataRequest(sendResponse);
        return true;

      case 'SEARCH_USERS_REQUEST':
        this.handleSearchUsers(message as UserSearchMessage, sendResponse);
        return true;

      case 'SET_SESSION_KEY': {
        const sessionKey = (message as SessionMessage).sessionKey;
        if (sessionKey) {
          this.saveSessionKey(sessionKey);
        }
        sendResponse({ success: true });
        return false;
      }

      case 'GET_SESSION_KEY':
        sendResponse({ success: true, sessionKey: this.sessionKey || undefined });
        return false;

      case 'CLEAR_SESSION_KEY':
        this.sessionKey = null;
        sessionStorage.removeItem('levelup_session_key');
        sendResponse({ success: true });
        return false;

      case 'GET_PAGE_CONTEXT':
        this.handleGetPageContext(sendResponse).catch(() => {
          sendResponse({ success: false, pageContext: null });
        });
        return true;

      default:
        return false;
    }
  }

  private handleMetadataRequest(sendResponse: (response: ContentScriptResponse) => void): void {
    // Starting GET_ENTITY_METADATA_REQUEST handling

    // Forward the request to the injected script to get entities from Dynamics 365
    const requestId = Date.now().toString();
    window.postMessage(
      {
        type: 'GET_ENTITY_METADATA_REQUEST',
        requestId: requestId,
      },
      window.location.origin
    );

    console.log(
      'Content script: Posted GET_ENTITY_METADATA_REQUEST to injected script with requestId:',
      requestId
    );

    // Set up a one-time listener for the response
    const responseListener = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      console.log('Content script: Received message from injected script:', event.data);

      if (
        event.data.type === 'GET_ENTITY_METADATA_RESPONSE' &&
        event.data.requestId === requestId
      ) {
        console.log(
          'Content script: Matched GET_ENTITY_METADATA_RESPONSE, sending back to background'
        );
        window.removeEventListener('message', responseListener);
        sendResponse(event.data);
      }
    };

    window.addEventListener('message', responseListener);
  }

  private handleSearchUsers(
    message: UserSearchMessage,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    // Starting SEARCH_USERS_REQUEST handling

    // Forward the request to the injected script to search users in Dynamics 365
    const requestId = Date.now().toString();
    window.postMessage(
      {
        type: 'LEVELUP_REQUEST',
        action: 'admin:search-users',
        data: { query: message.query },
        requestId: requestId,
      },
      window.location.origin
    );

    console.log(
      'Content script: Posted SEARCH_USERS_REQUEST to injected script with requestId:',
      requestId
    );

    // Set up a one-time listener for the response
    const responseListener = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      console.log('Content script: Received message from injected script:', event.data);

      if (event.data.type === 'LEVELUP_RESPONSE' && event.data.requestId === requestId) {
        console.log('Content script: Matched SEARCH_USERS_RESPONSE, sending back to background');
        window.removeEventListener('message', responseListener);
        sendResponse(event.data);
      }
    };

    window.addEventListener('message', responseListener);
  }

  private async handleGetPageContext(
    sendResponse: (response: ContentScriptResponse) => void
  ): Promise<void> {
    // Check if this is a Dynamics page first
    const isDynamicsPage = await this.isDynamics365Page();
    if (!isDynamicsPage) {
      sendResponse({ success: false, pageContext: null });
      return;
    }

    // Quick check if Xrm is already available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.Xrm?.Utility?.getGlobalContext && win.Xrm?.Utility?.getPageContext) {
        try {
          const pageContext = win.Xrm.Utility.getPageContext().input;
          sendResponse({ success: true, pageContext: pageContext || null });
          return;
        } catch (error) {
          // Xrm is loaded but can't get page context
          sendResponse({ success: true, pageContext: null });
          return;
        }
      }
    } catch (error) {
      // Continue with timeout approach
    }

    // If Xrm isn't immediately available, wait with a shorter timeout
    const waitForXrmWithTimeout = (timeout: number = 1000): Promise<boolean> => {
      return new Promise(resolve => {
        const startTime = Date.now();
        const checkXrm = () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            if (win.Xrm?.Utility?.getGlobalContext && win.Xrm?.Utility?.getPageContext) {
              resolve(true);
              return;
            }
          } catch (error) {
            // Continue checking
          }

          if (Date.now() - startTime > timeout) {
            resolve(false);
            return;
          }

          setTimeout(checkXrm, 50); // Check more frequently
        };
        checkXrm();
      });
    };

    try {
      const xrmReady = await waitForXrmWithTimeout();
      if (xrmReady) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        try {
          const pageContext = win.Xrm.Utility.getPageContext().input;
          sendResponse({ success: true, pageContext: pageContext || null });
        } catch (error) {
          // Xrm is loaded but can't get page context
          sendResponse({ success: true, pageContext: null });
        }
      } else {
        // Xrm didn't load within timeout - still a Dynamics page but context not available
        sendResponse({ success: true, pageContext: null });
      }
    } catch (error) {
      sendResponse({ success: true, pageContext: null });
    }
  }
}

// Prevent multiple instantiations
if (!window.__levelUpContentScriptLoaded) {
  window.__levelUpContentScriptLoaded = true;

  // Initialize the content script
  new ContentScript();
}
