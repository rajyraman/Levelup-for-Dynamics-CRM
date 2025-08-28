import { ImpersonationUser } from '#types/global';

export interface TabImpersonation {
  user: ImpersonationUser;
  tabId: number;
  ruleId: number;
  hostname: string;
  createdAt: number;
}

export class ImpersonationService {
  // Track by tab ID for session rules
  private tabImpersonations: Map<number, TabImpersonation> = new Map();
  private nextRuleId = 1;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Rebuild in-memory state from any existing session rules so that
      // service worker restarts do not drop active impersonations.
      await this.reconstructFromExistingSessionRules();
      console.log('✅ ImpersonationService initialized and state reconstructed');
    } catch (error) {
      console.error('Error initializing ImpersonationService:', error);
    }
  }

  /**
   * Reconstruct in-memory tab impersonation map from existing session rules.
   * This avoids destroying active impersonations when the background/service
   * worker is restarted.
   */
  private async reconstructFromExistingSessionRules(): Promise<void> {
    try {
      this.tabImpersonations.clear();

      const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
      if (!sessionRules || sessionRules.length === 0) {
        this.nextRuleId = 1;
        return;
      }

      let maxId = 0;

      for (const rule of sessionRules) {
        try {
          const id = rule.id || 0;
          if (id > maxId) {
            maxId = id;
          }

          // Extract tabId from condition.tabIds if present
          const tabId =
            Array.isArray(rule.condition?.tabIds) && rule.condition.tabIds.length > 0
              ? rule.condition.tabIds[0]
              : undefined;

          // Extract hostname from urlFilter if it matches the expected pattern
          let hostname = '';
          if (typeof rule.condition?.urlFilter === 'string') {
            const match = rule.condition.urlFilter.match(/^https:\/\/([^/]+)\//i);
            if (match && match[1]) {
              hostname = match[1];
            }
          }

          // Extract CallerObjectId header value if present
          let callerObjectId = '';
          const reqHeaders = (rule.action as any)?.requestHeaders as
            | Array<{ header?: string; value?: string }>
            | undefined;
          if (Array.isArray(reqHeaders) && reqHeaders.length > 0) {
            const hdr = reqHeaders.find(
              h => h && h.header && h.header.toLowerCase() === 'callerobjectid'
            );
            if (hdr && hdr.value) {
              callerObjectId = hdr.value;
            }
          }

          if (tabId && callerObjectId) {
            const impersonation = {
              user: { azureactivedirectoryobjectid: callerObjectId, fullname: 'Unknown' } as any,
              tabId,
              ruleId: id,
              hostname,
              createdAt: Date.now(),
            } as TabImpersonation;

            this.tabImpersonations.set(tabId, impersonation);
          }
        } catch (e) {
          console.warn('Could not parse session rule during reconstruction:', e, rule);
        }
      }

      this.nextRuleId = maxId + 1;
      console.log(
        '🧩 Reconstructed',
        this.tabImpersonations.size,
        'impersonations, nextRuleId=',
        this.nextRuleId
      );

      // Rebuild action badges for reconstructed impersonations
      for (const [tabId, imp] of this.tabImpersonations.entries()) {
        try {
          const initials = this.computeInitials(imp.user.fullname || '');
          await this.setActionBadgeForTab(tabId, initials, `Impersonating ${imp.user.fullname}`);
        } catch (e) {
          // ignore badge errors
        }
      }
    } catch (error) {
      console.error('Error reconstructing session rules:', error);
      // Fallback to a safe default
      this.tabImpersonations.clear();
      this.nextRuleId = 1;
    }
  }

  /**
   * Start impersonation for a specific tab
   */
  async startImpersonation(
    tabId: number,
    tabUrl: string | undefined,
    user: ImpersonationUser
  ): Promise<void> {
    if (!user.azureactivedirectoryobjectid) {
      throw new Error('User does not have an Azure AD Object ID');
    }

    if (!tabId) {
      throw new Error('No tab id provided to start impersonation');
    }

    // Validate & parse URL safely (avoid crashes on chrome://, edge://, about:blank, undefined)
    let hostname: string;
    try {
      if (!tabUrl || !/^https?:\/\//i.test(tabUrl)) {
        throw new Error('Impersonation only supported on Dynamics https pages');
      }
      const urlObj = new URL(tabUrl);
      hostname = urlObj.hostname;
    } catch (e) {
      console.warn('[ImpersonationService] Invalid tabUrl for impersonation:', tabUrl, e);
      throw new Error('Cannot start impersonation on this tab');
    }

    // Stop any existing impersonation for this tab
    await this.stopImpersonationForTab(tabId);

    // Create new impersonation
    const ruleId = this.nextRuleId++;

    const impersonation: TabImpersonation = {
      user,
      tabId,
      hostname,
      ruleId,
      createdAt: Date.now(),
    };

    // Store in memory
    this.tabImpersonations.set(tabId, impersonation);

    // Create Chrome session rule scoped to this tab
    await this.createSessionRule(impersonation);

    // Set extension action badge (initials) for this tab
    try {
      const initials = this.computeInitials(user.fullname || '');
      await this.setActionBadgeForTab(tabId, initials, `Impersonating ${user.fullname}`);
    } catch (e) {
      // ignore badge set errors
    }

    console.log(
      '🎭 Impersonation started for user:',
      user.fullname,
      'on tab:',
      tabId,
      'hostname:',
      hostname
    );
  }

  /**
   * Stop impersonation for current tab
   */
  async stopImpersonation(tabId?: number): Promise<void> {
    // If tabId provided, use it; otherwise fall back to active tab
    let targetTabId = tabId;
    if (!targetTabId) {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        throw new Error('No active tab found');
      }
      targetTabId = currentTab.id;
    }

    await this.stopImpersonationForTab(targetTabId);
    // Clear extension badge for this tab
    try {
      await this.clearActionBadgeForTab(targetTabId);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Get impersonation status for current tab
   */
  async getImpersonationStatus(tabId?: number): Promise<ImpersonationUser | null> {
    // If tabId provided, use it; otherwise fall back to active tab
    let targetTabId = tabId;
    if (!targetTabId) {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        return null;
      }
      targetTabId = currentTab.id;
    }

    const impersonation = this.tabImpersonations.get(targetTabId);
    return impersonation ? impersonation.user : null;
  }

  /**
   * Clean up impersonation when tab is closed
   */
  async handleTabClosed(tabId: number): Promise<void> {
    const impersonation = this.tabImpersonations.get(tabId);
    if (impersonation) {
      await this.stopImpersonationForTab(tabId);
      console.log('🗑️ [TAB_CLOSED] Cleaned up impersonation for tab:', tabId);
    }
  }

  /**
   * Get debug information about current impersonation state
   */
  async getDebugInfo(): Promise<any> {
    const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

    return {
      tabImpersonations: Array.from(this.tabImpersonations.entries()),
      sessionRules: sessionRules,
      dynamicRules: dynamicRules,
      nextRuleId: this.nextRuleId,
      totalActiveRules: sessionRules.length + dynamicRules.length,
    };
  }

  /**
   * Clean up on extension startup/install
   */
  async initializeOnStartup(): Promise<void> {
    try {
      // Clear existing session rules and memory - session rules may persist across browser restarts
      await this.clearAllSessionRules();
      this.tabImpersonations.clear();
      // Reset rule ID counter to avoid conflicts with orphaned rules
      this.nextRuleId = 1;

      console.log('✅ ImpersonationService initialized on startup - all previous state cleared');
    } catch (error) {
      console.error('Error initializing impersonation on startup:', error);
    }
  }

  /**
   * Force clear all impersonation state (useful for debugging or emergency cleanup)
   */
  async forceCleanup(): Promise<void> {
    try {
      await this.clearAllSessionRules();
      this.tabImpersonations.clear();
      // Reset rule ID counter
      this.nextRuleId = 1;
      console.log('🧹 Force cleanup completed - all impersonation state cleared');
    } catch (error) {
      console.error('Error during force cleanup:', error);
    }
  }

  private async stopImpersonationForTab(tabId: number): Promise<void> {
    const impersonation = this.tabImpersonations.get(tabId);

    if (impersonation) {
      try {
        // Remove Chrome session rule
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [impersonation.ruleId],
        });
        console.log('🎭 Removed session rule:', impersonation.ruleId, 'for tab:', tabId);
      } catch (error) {
        console.error('Error removing session rule:', impersonation.ruleId, error);
        // Still continue to clean up memory even if rule removal failed
      }

      // Remove from memory
      this.tabImpersonations.delete(tabId);

      // Clear action badge for this tab
      try {
        await this.clearActionBadgeForTab(tabId);
      } catch (e) {
        // ignore
      }

      console.log('🎭 Impersonation stopped for tab:', tabId);
    } else {
      console.log('🎭 No impersonation found for tab:', tabId);
    }
  }

  private computeInitials(name: string): string {
    if (!name) {
      return '';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Public helper for debugging/tests: set badge + icon for a tab
  async setBadgeForTab(tabId: number, initials: string, title?: string) {
    await this.setActionBadgeForTab(tabId, initials, title);
  }

  // Public helper for debugging/tests: clear badge + icon for a tab
  async clearBadgeForTab(tabId: number) {
    await this.clearActionBadgeForTab(tabId);
  }

  private async setActionBadgeForTab(tabId: number, text: string, title?: string) {
    try {
      // Set badge text for the specific tab (if supported)
      const badgeText = text && String(text).trim().length > 0 ? String(text).slice(0, 4) : 'IM';
      try {
        chrome.action.setBadgeText({ text: badgeText, tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#1976d2', tabId });
        if (title) {
          chrome.action.setTitle({ title, tabId });
        }
      } catch (perTabErr) {
        // Some browsers may not support tab-scoped badge APIs; ignore and fallback
      }

      // Also set a global badge as a visible fallback for browsers that do
      // not render tab-scoped badges prominently.
      try {
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: '#1976d2' });
        if (title) {
          chrome.action.setTitle({ title });
        }
      } catch (globalErr) {
        // ignore global badge set errors
      }
    } catch (e) {
      // ignore if API isn't available
    }
  }

  private async clearActionBadgeForTab(tabId: number) {
    try {
      // Clear both tab-scoped and global badges to ensure visibility cleared
      try {
        chrome.action.setBadgeText({ text: '', tabId });
        chrome.action.setTitle({ title: 'Level Up', tabId });
      } catch (perTabErr) {
        // ignore
      }

      try {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({ title: 'Level Up' });
      } catch (globalErr) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  }

  private async createSessionRule(impersonation: TabImpersonation): Promise<void> {
    const rule: chrome.declarativeNetRequest.Rule = {
      id: impersonation.ruleId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: 'CallerObjectId',
            value: impersonation.user.azureactivedirectoryobjectid,
          },
        ],
      },
      condition: {
        tabIds: [impersonation.tabId], // Scope rule to specific tab
        urlFilter: `https://${impersonation.hostname}/api/data/v*`,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        ],
      },
    };

    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [rule],
    });

    console.log('📝 Created session rule:', rule.id, 'for tab:', impersonation.tabId);
  }

  private async clearAllSessionRules(): Promise<void> {
    try {
      // Snapshot current in-memory impersonations so we can clear badges
      const impersonatedTabIds = Array.from(this.tabImpersonations.keys());

      const existingRules = await chrome.declarativeNetRequest.getSessionRules();
      if (existingRules.length > 0) {
        const existingRuleIds = existingRules.map(rule => rule.id);
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: existingRuleIds,
        });
        console.log(
          '🧹 Cleared',
          existingRuleIds.length,
          'existing session rules:',
          existingRuleIds
        );

        // Also clear any dynamic rules that might be lingering (fallback cleanup)
        try {
          const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
          if (dynamicRules.length > 0) {
            const dynamicRuleIds = dynamicRules.map(rule => rule.id);
            await chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: dynamicRuleIds,
            });
            console.log('🧹 Also cleared', dynamicRuleIds.length, 'dynamic rules:', dynamicRuleIds);
          }
        } catch (dynamicError) {
          console.warn('Could not clear dynamic rules:', dynamicError);
        }
      } else {
        console.log('✅ No existing session rules to clear');
      }

      // Clear in-memory impersonations and badges to keep UI in sync
      try {
        for (const tabId of impersonatedTabIds) {
          try {
            await this.clearActionBadgeForTab(tabId);
          } catch (e) {
            // ignore individual badge clear errors
          }
        }
      } catch (e) {
        // ignore
      }

      this.tabImpersonations.clear();
      this.nextRuleId = 1;
    } catch (error) {
      console.error('Error clearing session rules:', error);
      // If there's an error, try to clear them individually
      try {
        // Get rules again and try to clear them one by one
        const rules = await chrome.declarativeNetRequest.getSessionRules();
        for (const rule of rules) {
          try {
            await chrome.declarativeNetRequest.updateSessionRules({
              removeRuleIds: [rule.id],
            });
            console.log('🧹 Individually cleared session rule:', rule.id);
          } catch (individualError) {
            console.warn('Could not clear session rule:', rule.id, individualError);
          }
        }

        // Also try to clear dynamic rules individually
        const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
        for (const rule of dynamicRules) {
          try {
            await chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: [rule.id],
            });
            console.log('🧹 Individually cleared dynamic rule:', rule.id);
          } catch (individualError) {
            console.warn('Could not clear dynamic rule:', rule.id, individualError);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError);
      }
      // Ensure in-memory state is cleared in case of failure
      try {
        for (const [tabId] of this.tabImpersonations.entries()) {
          try {
            await this.clearActionBadgeForTab(tabId);
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
      this.tabImpersonations.clear();
      this.nextRuleId = 1;
    }
  }
}

// Singleton instance
export const impersonationService = new ImpersonationService();
