export interface BrowserAdapter {
  name: string;

  openSidebar(tabId?: number): Promise<void>;
  setupContextMenu(): void;
  updateSidePanelForTab(
    tabId: number,
    url?: string | null,
    options?: { openIfDynamics?: boolean; force?: boolean },
    userClosedPanelTabs?: Set<number>
  ): Promise<void>;
  sendMessage(message: unknown): Promise<void>;
  scripting: typeof chrome.scripting | typeof browser.scripting;
  runtime: typeof chrome.runtime | typeof browser.runtime;
  tabs: typeof chrome.tabs | typeof browser.tabs;
  action: typeof chrome.action | typeof browser.action;
  declarativeNetRequest: typeof chrome.declarativeNetRequest | typeof browser.declarativeNetRequest;
}

export * from './firefox';
export * from './chrome';
