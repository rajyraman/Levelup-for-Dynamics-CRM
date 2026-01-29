import { BrowserAdapter } from '.';

export class FirefoxAdapter implements BrowserAdapter {
  name = 'Firefox';
  scripting = browser.scripting;
  runtime = browser.runtime;
  tabs = browser.tabs;
  action = browser.action;
  declarativeNetRequest = browser.declarativeNetRequest;

  async openSidebar(): Promise<void> {
    // Firefox sidebar is global, doesn't need tabId
    await browser.sidebarAction?.open();
  }

  async updateSidePanelForTab(tabId: number, url?: string | null): Promise<void> {
    // Firefox sidebar is global, not per-tab like Chrome sidePanel
    // Just inject content script if needed
    if (url) {
      const isLoaded = await this.checkContentScriptLoaded(tabId);
      if (!isLoaded) {
        try {
          await this.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
          });
          console.log(
            `🔍 [UpdatePanel] Content script injected for Firefox sidebar communication on tab ${tabId}`
          );
        } catch (error) {
          console.log(`🔍 [UpdatePanel] Content script injection failed for tab ${tabId}:`, error);
        }
      }
    }
    return;
  }

  private async checkContentScriptLoaded(tabId: number): Promise<boolean> {
    try {
      const results = await this.scripting.executeScript({
        target: { tabId },
        //@ts-ignore Firefox types only accept void return type
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

  setupContextMenu(): void {
    const contextMenusAPI = browser.menus;

    contextMenusAPI.removeAll();
    contextMenusAPI.create({
      id: 'levelup-open',
      title: 'Open Level Up Sidebar',
      contexts: ['page'],
    });

    contextMenusAPI.onClicked.addListener(
      async (info: browser.menus.OnClickData, tab?: browser.tabs.Tab) => {
        if (info.menuItemId === 'levelup-open' && tab?.id) {
          try {
            await this.openSidebar();
            console.log(' [ContextMenu] Opened Firefox sidebar via context menu');
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
