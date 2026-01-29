// Background service worker for Level Up extension
import {
  ActionMessage,
  ChromeTab,
  ChromeTabChangeInfo,
  ChromeActiveInfo,
  ImpersonationUser,
} from '#types/global';
import { ActionHandlerRegistry } from '#services/ActionHandlerRegistry';
import { messageService } from '#services/MessageService';
import { impersonationService } from '#services/ImpersonationService';
import { FirefoxAdapter, ChromeAdapter } from './adapters';

// Browser detection and adapter selection
const isFirefox = typeof browser !== 'undefined';
const adapter = isFirefox ? new FirefoxAdapter() : new ChromeAdapter();

// Initialize message service and handlers
console.log('🚀 [Background] Starting background script...');
ActionHandlerRegistry.registerAllHandlers();

// Signal that the message service can now process incoming requests queued
// during service worker startup. This ensures messages sent from the sidebar
// while the background was initializing are not dropped with "No handler"
try {
  if (typeof messageService.setReady === 'function') {
    messageService.setReady();
    console.log('✅ [Background] MessageService marked as ready');
  }
} catch (e) {
  console.warn('⚠️ [Background] Could not mark MessageService ready:', e);
}

// Add debugging to check if action listener is being registered
console.log('🚀 [Background] Registering action.onClicked listener...');

// Register impersonation handlers that need background script access
messageService.registerHandler(
  'admin:start-impersonation',
  async (data: unknown, sender?: chrome.runtime.MessageSender) => {
    // data may include explicit tabId/tabUrl and openInWindow flag from the sidebar
    const payload = data as
      | { user?: ImpersonationUser; tabId?: number; tabUrl?: string; openInWindow?: boolean }
      | undefined;
    const userData = payload?.user as ImpersonationUser | undefined;
    // No longer support opening impersonation in a new window — start impersonation
    // in the resolved target tab for simplicity.
    // (Previously we had an `openInWindow` option; removed per request.)

    // Prefer explicit payload.tabId, then sender.tab, then active tab
    let targetTabId = payload?.tabId ?? sender?.tab?.id;
    let tabUrl = payload?.tabUrl;

    if (targetTabId && !tabUrl) {
      try {
        const tab = await adapter.tabs.get(targetTabId);
        tabUrl = tab.url;
      } catch (e) {
        // ignore
      }
    }

    if (!targetTabId || !tabUrl) {
      const [currentTab] = await adapter.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id || !currentTab?.url) {
        throw new Error('No active tab found');
      }
      targetTabId = currentTab.id;
      tabUrl = currentTab.url;
    }

    if (!userData) {
      throw new Error('No user provided for impersonation');
    }

    // Always start impersonation in the resolved target tab
    await impersonationService.startImpersonation(targetTabId, tabUrl, userData);
    return { success: true };
  }
);

messageService.registerHandler(
  'admin:stop-impersonation',
  async (data: unknown, sender?: chrome.runtime.MessageSender) => {
    const payload = data as { tabId?: number } | undefined;
    let targetTabId = payload?.tabId ?? sender?.tab?.id;

    if (!targetTabId) {
      const [currentTab] = await adapter.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        throw new Error('No active tab found');
      }
      targetTabId = currentTab.id;
    }

    await impersonationService.stopImpersonation(targetTabId);
    return { success: true };
  }
);

messageService.registerHandler(
  'admin:get-impersonation-status',
  async (data: unknown, sender?: chrome.runtime.MessageSender) => {
    const payload = data as { tabId?: number } | undefined;
    const targetTabId = payload?.tabId ?? sender?.tab?.id;

    if (targetTabId) {
      return await impersonationService.getImpersonationStatus(targetTabId);
    }

    const [currentTab] = await adapter.tabs.query({ active: true, currentWindow: true });
    if (!currentTab?.id) {
      return null;
    }

    return await impersonationService.getImpersonationStatus(currentTab.id);
  }
);

messageService.registerHandler('admin:force-cleanup-impersonation', async () => {
  await impersonationService.forceCleanup();
  return { success: true };
});

console.log(
  `✅ [Background] Message service initialized with ${messageService.getStats().registeredHandlers} handlers`
);

adapter.runtime.onInstalled.addListener(async () => {
  console.log('Level Up for Dynamics 365 extension installed');
  await impersonationService.initializeOnStartup();
});

// Also initialize on startup
adapter.runtime.onStartup.addListener(async () => {
  console.log('Level Up for Dynamics 365 extension startup');
  await impersonationService.initializeOnStartup();
});

// Initialize immediately when service worker becomes active
(async () => {
  console.log('Level Up for Dynamics 365 service worker active');
  await impersonationService.initializeOnStartup();
})();

// Handle extension icon click to open sidebar directly
adapter.action.onClicked.addListener(async tab => {
  if (tab.id) {
    try {
      await adapter.openSidebar(tab.id);
      console.log(`🎯 [Action] Opened ${adapter.name} sidebar via extension icon click`);
    } catch (error) {
      console.log(`🎯 [Action] Failed to open ${adapter.name} sidebar:`, error);
    }
  }
});

console.log(`🎯 [Background] Extension icon click will open ${adapter.name} sidebar directly`);

// Add context menu as alternative way to open sidebar
try {
  // Use the adapter to set up context menu
  adapter.setupContextMenu();
  console.log(`🔍 [ContextMenu] Set up context menu for ${adapter.name}`);
} catch (error) {
  console.log('🔍 [ContextMenu] Failed to set up context menu:', error);
}

// Track tabs where user explicitly closed the side panel to avoid auto-reopen
const userClosedPanelTabs = new Set<number>();

// Update side panel state on tab update
adapter.tabs.onUpdated.addListener(
  async (tabId: number, changeInfo: ChromeTabChangeInfo, tab: ChromeTab) => {
    if (changeInfo.status === 'complete') {
      await adapter.updateSidePanelForTab(
        tabId,
        tab.url,
        { openIfDynamics: true },
        userClosedPanelTabs
      );
    }
  }
);

// Update side panel state when switching tabs
adapter.tabs.onActivated.addListener(async (activeInfo: ChromeActiveInfo) => {
  try {
    const tab = await adapter.tabs.get(activeInfo.tabId);
    await adapter.updateSidePanelForTab(
      activeInfo.tabId,
      tab.url,
      { openIfDynamics: true },
      userClosedPanelTabs
    );
  } catch (error) {
    console.log('Could not access tab info:', error);
  }
});

// On install/startup, apply side panel state to all existing tabs
async function initializeSidePanelState() {
  try {
    const tabs = await adapter.tabs.query({});
    for (const t of tabs) {
      if (t.id !== undefined) {
        await adapter.updateSidePanelForTab(
          t.id,
          t.url,
          { openIfDynamics: false },
          userClosedPanelTabs
        );
      }
    }
  } catch (e) {
    console.log('[Background] Failed to initialize side panel state:', e);
  }
}

initializeSidePanelState();

// Handle tab removal to clean up impersonation
adapter.tabs.onRemoved.addListener(async (tabId: number) => {
  await impersonationService.handleTabClosed(tabId);
});

// Handle messages from content script and sidebar
adapter.runtime.onMessage.addListener(
  (
    message: ActionMessage,
    sender: chrome.runtime.MessageSender | browser.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    console.log(message);
    // All other messages are handled by MessageService
    if (message.type === 'LEVELUP_REQUEST') {
      // Handle impersonation actions
      if (message.action === 'admin:start-impersonation' && message.data) {
        const userData = message.data as { user: ImpersonationUser };

        // Handle async operation properly
        (async () => {
          try {
            const senderTabId = sender?.tab?.id;

            if (senderTabId) {
              // Try to get the tab URL for validation
              let tabUrl: string | undefined;
              try {
                const tab = await adapter.tabs.get(senderTabId);
                tabUrl = tab.url;
              } catch (e) {
                // ignore
              }

              await impersonationService.startImpersonation(senderTabId, tabUrl, userData.user);
              sendResponse({ success: true });
              return;
            }

            // Fallback to active tab
            const [currentTab] = await adapter.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (!currentTab?.id || !currentTab?.url) {
              throw new Error('No active tab found');
            }

            await impersonationService.startImpersonation(
              currentTab.id,
              currentTab.url,
              userData.user
            );
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })();

        return true; // Keep message channel open
      }

      if (message.action === 'admin:stop-impersonation') {
        // Handle async operation properly
        (async () => {
          try {
            const senderTabId = sender?.tab?.id;

            if (senderTabId) {
              await impersonationService.stopImpersonation(senderTabId);
              sendResponse({ success: true });
              return;
            }

            // Fallback to active tab
            const [currentTab] = await adapter.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (!currentTab?.id) {
              throw new Error('No active tab found');
            }

            await impersonationService.stopImpersonation(currentTab.id);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })();

        return true; // Keep message channel open
      }

      console.log(
        '🔍 [Background Listener] Other actions handled by MessageService, not forwarding'
      );
    }

    // Let other handlers (like MessageService) handle non-impersonation messages
    return false;
  }
);

// Listen for LEVELUP_RESPONSE messages from content scripts to forward to sidebar
adapter.runtime.onMessage.addListener(message => {
  console.log('🔍 [Background] Received message:', message);

  if (message.type === 'LEVELUP_RESPONSE') {
    console.log('🔍 [Background] Forwarding LEVELUP_RESPONSE to sidebar:', message);
    // Forward the response to any listening sidebar
    adapter.sendMessage(message).catch((error: unknown) => {
      console.log('🔍 [Background] No sidebar listening for response (this is normal):', error);
    });
  }

  return false; // Don't keep the message channel open
});

export {};
