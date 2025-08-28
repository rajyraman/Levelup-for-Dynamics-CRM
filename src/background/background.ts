// Background service worker for Level Up extension
import {
  ActionMessage,
  ChromeTab,
  ChromeTabChangeInfo,
  ChromeActiveInfo,
  ChromeRuntimeSender,
  ImpersonationUser,
} from '#types/global';
import { ActionHandlerRegistry } from '#services/ActionHandlerRegistry';
import { messageService } from '#services/MessageService';
import { impersonationService } from '#services/ImpersonationService';

/**
 * Check if content script is already loaded in a tab
 */
async function checkContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return !!window.__levelUpContentScriptLoaded;
      },
    });
    return results && results[0] && results[0].result === true;
  } catch (error) {
    // If script execution fails, assume content script is not loaded
    return false;
  }
}

/**
 * Check if a page is a Dynamics 365 page using multiple detection methods
 */
async function isDynamics365Page(tabId: number): Promise<boolean> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
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
      },
    });

    return results && results[0] && results[0].result === true;
  } catch (error) {
    // If script execution fails, assume it's not a Dynamics page
    return false;
  }
}

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
        const tab = await chrome.tabs.get(targetTabId);
        tabUrl = tab.url;
      } catch (e) {
        // ignore
      }
    }

    if (!targetTabId || !tabUrl) {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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

    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Level Up for Dynamics 365 extension installed');
  await impersonationService.initializeOnStartup();
});

// Also initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Level Up for Dynamics 365 extension startup');
  await impersonationService.initializeOnStartup();
});

// Initialize immediately when service worker becomes active
(async () => {
  console.log('Level Up for Dynamics 365 service worker active');
  await impersonationService.initializeOnStartup();
})();

// Handle extension icon click to open sidebar directly
chrome.action.onClicked.addListener(async tab => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('🎯 [Action] Opened sidebar via extension icon click');
    } catch (error) {
      console.log('🎯 [Action] Failed to open sidebar:', error);
    }
  }
});

console.log('🎯 [Background] Extension icon click will open sidebar directly');

// Add context menu as alternative way to open sidebar
try {
  // Remove existing context menu items first to prevent duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'levelup-open',
      title: 'Open Level Up Sidebar',
      contexts: ['page'],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'levelup-open' && tab?.id) {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('🔍 [ContextMenu] Opened sidebar via context menu');
      } catch (error) {
        console.log('🔍 [ContextMenu] Failed to open sidebar:', error);
      }
    }
  });
  console.log('✅ [Background] Context menu fallback registered');
} catch (contextMenuError) {
  console.error('❌ [Background] Failed to register context menu:', contextMenuError);
}

// Track tabs where user explicitly closed the side panel to avoid auto-reopen
const userClosedPanelTabs = new Set<number>();

async function updateSidePanelForTab(
  tabId: number,
  url?: string | null,
  options?: { openIfDynamics?: boolean; force?: boolean }
) {
  if (!chrome.sidePanel || typeof chrome.sidePanel.setOptions !== 'function') {
    return;
  } // Safety guard

  // For navigation events, check if it's Dynamics and inject content script if needed
  const isDynamicsPage = await isDynamics365Page(tabId);

  if (url) {
    // Always inject content script so sidebar can communicate
    // The content script will determine internally if it should activate features
    try {
      const isLoaded = await checkContentScriptLoaded(tabId);
      if (!isLoaded) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
          });
          console.log(
            `🔍 [UpdatePanel] Content script injected for sidebar communication on tab ${tabId}`
          );
        } catch (error) {
          console.log(`🔍 [UpdatePanel] Content script injection failed for tab ${tabId}:`, error);
        }
      } else {
        console.log(`🔍 [UpdatePanel] Content script already loaded for tab ${tabId}`);
      }
    } catch (error) {
      console.log(`🔍 [UpdatePanel] Script injection failed for tab ${tabId}:`, error);
    }
  }

  // Always keep side panel enabled so user sees an informational message on non-Dynamics tabs
  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidebar.html',
      enabled: true,
    });
  } catch (e) {
    console.log('[Background] Failed to set side panel options:', e);
  }

  // Auto-open only for Dynamics tabs (previous behavior) unless user previously closed it
  if (
    isDynamicsPage &&
    options?.openIfDynamics &&
    (options.force || !userClosedPanelTabs.has(tabId))
  ) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (e) {
      console.log('[Background] Failed to open side panel:', e);
    }
  }
}

// Update side panel state on tab update
chrome.tabs.onUpdated.addListener(
  async (tabId: number, changeInfo: ChromeTabChangeInfo, tab: ChromeTab) => {
    if (changeInfo.status === 'complete') {
      await updateSidePanelForTab(tabId, tab.url, { openIfDynamics: true });
    }
  }
);

// Update side panel state when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo: ChromeActiveInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await updateSidePanelForTab(activeInfo.tabId, tab.url, { openIfDynamics: true });
  } catch (error) {
    console.log('Could not access tab info:', error);
  }
});

// On install/startup, apply side panel state to all existing tabs
async function initializeSidePanelState() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id !== undefined) {
        await updateSidePanelForTab(t.id, t.url, { openIfDynamics: false });
      }
    }
  } catch (e) {
    console.log('[Background] Failed to initialize side panel state:', e);
  }
}

initializeSidePanelState();

// Handle tab removal to clean up impersonation
chrome.tabs.onRemoved.addListener(async (tabId: number) => {
  await impersonationService.handleTabClosed(tabId);
});

// Handle messages from content script and sidebar
chrome.runtime.onMessage.addListener(
  (
    message: ActionMessage,
    sender: ChromeRuntimeSender,
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
                const tab = await chrome.tabs.get(senderTabId);
                tabUrl = tab.url;
              } catch (e) {
                // ignore
              }

              await impersonationService.startImpersonation(senderTabId, tabUrl, userData.user);
              sendResponse({ success: true });
              return;
            }

            // Fallback to active tab
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
chrome.runtime.onMessage.addListener(message => {
  console.log('🔍 [Background] Received message:', message);

  if (message.type === 'LEVELUP_RESPONSE') {
    console.log('🔍 [Background] Forwarding LEVELUP_RESPONSE to sidebar:', message);
    // Forward the response to any listening sidebar
    chrome.runtime.sendMessage(message).catch(error => {
      console.log('🔍 [Background] No sidebar listening for response (this is normal):', error);
    });
  }

  return false; // Don't keep the message channel open
});

export {};
