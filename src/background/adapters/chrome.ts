import { BrowserAdapter } from '.';

export class ChromeAdapter implements BrowserAdapter {
  name = 'Chrome';

  scripting = chrome.scripting;
  runtime = chrome.runtime;
  tabs = chrome.tabs;
  action = chrome.action;

  async openSidebar(tabId?: number): Promise<void> {
    if (!tabId) {
      throw new Error('Tab ID is required for Chrome side panel');
    }
    await chrome.sidePanel.open({ tabId });
  }

  async updateSidePanelForTab(
    tabId: number,
    url?: string | null,
    options?: { openIfDynamics?: boolean; force?: boolean },
    userClosedPanelTabs?: Set<number>
  ): Promise<void> {
    // For navigation events, check if it's Dynamics and inject content script if needed
    const isDynamicsPage = await this.isDynamics365Page(tabId);

    if (url) {
      // Always inject content script so sidebar can communicate
      // The content script will determine internally if it should activate features
      try {
        const isLoaded = await this.checkContentScriptLoaded(tabId);
        if (!isLoaded) {
          try {
            await this.scripting.executeScript({
              target: { tabId },
              files: ['content.js'],
            });
            console.log(
              `🔍 [UpdatePanel] Content script injected for sidebar communication on tab ${tabId}`
            );
          } catch (error) {
            console.log(
              `🔍 [UpdatePanel] Content script injection failed for tab ${tabId}:`,
              error
            );
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
      (options?.openIfDynamics || options?.force) &&
      (options?.force || !userClosedPanelTabs?.has(tabId))
    ) {
      try {
        await chrome.sidePanel.open({ tabId });
      } catch (e) {
        console.log('[Background] Failed to open side panel:', e);
      }
    } else {
      console.log(
        `🔍 [UpdatePanel] Not auto-opening side panel for tab ${tabId}. Dynamics: ${isDynamicsPage}, openIfDynamics: ${options?.openIfDynamics}, force: ${options?.force}, userClosed: ${userClosedPanelTabs?.has(tabId)}`
      );
    }
  }

  private async checkContentScriptLoaded(tabId: number): Promise<boolean> {
    try {
      const results = await this.scripting.executeScript({
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

  private async isDynamics365Page(tabId: number): Promise<boolean> {
    try {
      const results = await this.scripting.executeScript({
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

  setupContextMenu(): void {
    const contextMenusAPI = chrome.contextMenus;

    contextMenusAPI.removeAll(() => {
      contextMenusAPI.create({
        id: 'levelup-open',
        title: 'Open Level Up Sidebar',
        contexts: ['page'],
      });
    });

    contextMenusAPI.onClicked.addListener(
      async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
        if (info.menuItemId === 'levelup-open' && tab?.id) {
          try {
            await this.openSidebar(tab.id);
            console.log(' [ContextMenu] Opened Chrome side panel via context menu');
          } catch (error) {
            console.log(' [ContextMenu] Failed to open sidebar:', error);
          }
        }
      }
    );
  }

  sendMessage(message: unknown): Promise<void> {
    return this.runtime.sendMessage(message);
  }
}
