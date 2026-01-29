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
}

export * from './firefox';
export * from './chrome';
