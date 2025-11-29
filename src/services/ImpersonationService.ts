import { ImpersonationUser } from '#types/global';
import { isOnPremisesEnvironment } from '#background/dynamics-detection';

export interface EnvironmentImpersonation {
  user: ImpersonationUser;
  ruleId: number;
  hostname: string;
  createdAt: number;
  isOnPremises: boolean;
}

export class ImpersonationService {
  // Track by environment URL (hostname) for dynamic rules
  private environmentImpersonations: Map<string, EnvironmentImpersonation> = new Map();
  private nextRuleId = 1;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Rebuild in-memory state from any existing dynamic rules so that
      // service worker restarts do not drop active impersonations.
      await this.reconstructFromExistingDynamicRules();
      console.log('✅ ImpersonationService initialized and state reconstructed');
    } catch (error) {
      console.error('Error initializing ImpersonationService:', error);
    }
  }

  /**
   * Reconstruct in-memory environment impersonation map from existing dynamic rules.
   * This avoids destroying active impersonations when the background/service
   * worker is restarted.
   */
  private async reconstructFromExistingDynamicRules(): Promise<void> {
    try {
      this.environmentImpersonations.clear();

      const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('🔍 Reconstructing from', dynamicRules?.length || 0, 'dynamic rules');

      if (!dynamicRules || dynamicRules.length === 0) {
        this.nextRuleId = 1;
        console.log('✅ No dynamic rules found to reconstruct');
        return;
      }

      let maxId = 0;
      let reconstructedCount = 0;

      for (const rule of dynamicRules) {
        try {
          const id = rule.id || 0;
          if (id > maxId) {
            maxId = id;
          }

          // Extract hostname from urlFilter if it matches the expected pattern
          let hostname = '';
          if (typeof rule.condition?.urlFilter === 'string') {
            const match = rule.condition.urlFilter.match(/^https:\/\/([^/]+)\//i);
            if (match && match[1]) {
              hostname = match[1];
            }
          }

          // Extract impersonation header (either CallerObjectId or MSCRMCalledId)
          let userId = '';
          let isOnPremises = false;
          const reqHeaders = (rule.action as any)?.requestHeaders as
            | Array<{ header?: string; value?: string }>
            | undefined;
          if (Array.isArray(reqHeaders) && reqHeaders.length > 0) {
            // Check for CallerObjectId (Online)
            const callerObjectIdHdr = reqHeaders.find(
              h => h && h.header && h.header.toLowerCase() === 'callerobjectid'
            );
            if (callerObjectIdHdr && callerObjectIdHdr.value) {
              userId = callerObjectIdHdr.value;
              isOnPremises = false;
            } else {
              // Check for MSCRMCalledId (On-Premises)
              const mscrmCalledIdHdr = reqHeaders.find(
                h => h && h.header && h.header.toLowerCase() === 'mscrmcalledid'
              );
              if (mscrmCalledIdHdr && mscrmCalledIdHdr.value) {
                userId = mscrmCalledIdHdr.value;
                isOnPremises = true;
              }
            }
          }

          if (hostname && userId) {
            const impersonation = {
              user: {
                azureactivedirectoryobjectid: isOnPremises ? '' : userId,
                systemuserid: isOnPremises ? userId : '',
                fullname: 'Unknown'
              } as any,
              ruleId: id,
              hostname,
              createdAt: Date.now(),
              isOnPremises,
            } as EnvironmentImpersonation;

            this.environmentImpersonations.set(hostname, impersonation);
            reconstructedCount++;
            console.log('✅ Reconstructed impersonation for', hostname,
              isOnPremises ? '(On-Premises) with MSCRMCalledId:' : '(Online) with CallerObjectId:',
              userId);
          } else {
            console.warn('⚠️ Could not extract hostname/impersonation header from rule:', rule);
          }
        } catch (e) {
          console.warn('Could not parse dynamic rule during reconstruction:', e, rule);
        }
      }

      this.nextRuleId = maxId + 1;
      console.log(
        '🧩 Reconstructed',
        reconstructedCount,
        'impersonations from',
        dynamicRules.length,
        'rules, nextRuleId=',
        this.nextRuleId
      );

      // Update badges for all tabs with matching environments
      await this.updateBadgesForAllTabs();
    } catch (error) {
      console.error('❌ Error reconstructing dynamic rules:', error);
      // Fallback to a safe default
      this.environmentImpersonations.clear();
      this.nextRuleId = 1;
    }
  }

  /**
   * Start impersonation for a specific environment URL
   */
  async startImpersonation(
    tabId: number | undefined,
    tabUrl: string | undefined,
    user: ImpersonationUser
  ): Promise<void> {
    if (!user.azureactivedirectoryobjectid && !user.systemuserid) {
      throw new Error('User does not have AzureActiveDirectoryObjectId or SystemUserId');
    }

    // If no tab info provided, try to get current active tab
    if (!tabUrl && tabId) {
      try {
        const tab = await chrome.tabs.get(tabId);
        tabUrl = tab.url;
      } catch (e) {
        // Tab might be closed or invalid
      }
    }

    if (!tabUrl) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.url) {
          tabUrl = activeTab.url;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Validate & parse URL safely (avoid crashes on chrome://, edge://, about:blank, undefined)
    let hostname: string;
    try {
      if (!tabUrl || !/^https?:\/\//i.test(tabUrl)) {
        throw new Error('Impersonation only supported on Dynamics https pages. Please open a Dynamics 365 environment first.');
      }
      const urlObj = new URL(tabUrl);
      hostname = urlObj.hostname;
    } catch (e) {
      console.warn('[ImpersonationService] Invalid tabUrl for impersonation:', tabUrl, e);
      throw new Error('Cannot start impersonation. Please ensure you are on a Dynamics 365 page.');
    }

    // Stop any existing impersonation for this environment
    const existingImpersonation = this.environmentImpersonations.get(hostname);
    if (existingImpersonation) {
      // Only stop if it's for a different user
      if (existingImpersonation.user.azureactivedirectoryobjectid !== user.azureactivedirectoryobjectid) {
        console.log('🔄 Switching impersonation from', existingImpersonation.user.fullname, 'to', user.fullname);
        await this.stopImpersonationForEnvironment(hostname);
      } else {
        console.log('⚠️ Impersonation already active for this user on this environment, skipping');
        return;
      }
    }

    // Check if this is an on-premises environment
    const isOnPremises = tabId ? await isOnPremisesEnvironment(tabId) : false;
    console.log('🔍 Environment type:', isOnPremises ? 'On-Premises' : 'Online');

    // Create new impersonation
    const ruleId = this.nextRuleId++;

    const impersonation: EnvironmentImpersonation = {
      user,
      hostname,
      ruleId,
      createdAt: Date.now(),
      isOnPremises,
    };

    // Store in memory
    this.environmentImpersonations.set(hostname, impersonation);

    // Create Chrome dynamic rule for this environment
    await this.createDynamicRule(impersonation);

    // Update badges for all tabs with this environment
    await this.updateBadgesForEnvironment(hostname);

    console.log(
      '🎭 Impersonation started for user:',
      user.fullname,
      'on environment:',
      hostname
    );
  }

  /**
   * Stop impersonation for current environment
   */
  async stopImpersonation(environmentUrl: string): Promise<void> {
    console.log('🔍 [stopImpersonation] Called with URL:', environmentUrl, 'Type:', typeof environmentUrl);

    // Extract hostname from environment URL
    let hostname: string;
    try {
      if (!environmentUrl) {
        throw new Error('Environment URL is undefined or empty');
      }

      // Convert to string in case it's not
      const urlString = String(environmentUrl);

      if (!/^https?:\/\//i.test(urlString)) {
        throw new Error(`URL does not start with http:// or https://: ${urlString}`);
      }

      const urlObj = new URL(urlString);
      hostname = urlObj.hostname;
      console.log('✅ [stopImpersonation] Extracted hostname:', hostname);
    } catch (e) {
      console.error('❌ [stopImpersonation] URL validation failed:', e);
      console.warn('[ImpersonationService] Invalid URL for stopping impersonation:', environmentUrl);
      throw new Error(`Cannot stop impersonation - invalid environment URL: ${e instanceof Error ? e.message : String(e)}`);
    }

    await this.stopImpersonationForEnvironment(hostname);
  }

  /**
   * Get impersonation status for current environment
   */
  async getImpersonationStatus(environmentUrl: string): Promise<ImpersonationUser | null> {
    // Extract hostname from environment URL
    let hostname: string;
    try {
      if (!environmentUrl || !/^https?:\/\//i.test(environmentUrl)) {
        console.log('❌ [getImpersonationStatus] Invalid URL:', environmentUrl);
        return null;
      }
      const urlObj = new URL(environmentUrl);
      hostname = urlObj.hostname;
    } catch (e) {
      console.log('❌ [getImpersonationStatus] Failed to parse URL:', environmentUrl, e);
      return null;
    }

    const impersonation = this.environmentImpersonations.get(hostname);
    console.log('🔍 [getImpersonationStatus] Checking hostname:', hostname, 'Found:', !!impersonation, 'Total envs:', this.environmentImpersonations.size);
    console.log('🔍 [getImpersonationStatus] Returning user:', impersonation?.user);

    if (!impersonation) {
      // Check if there's a dynamic rule but not in memory
      const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('🔍 [getImpersonationStatus] Dynamic rules exist:', dynamicRules.length);
      if (dynamicRules.length > 0) {
        console.warn('⚠️ [getImpersonationStatus] Dynamic rules exist but not in memory! Reconstructing...');
        await this.reconstructFromExistingDynamicRules();
        // Try again after reconstruction
        const impersonationAfterReconstruct = this.environmentImpersonations.get(hostname);
        return impersonationAfterReconstruct ? impersonationAfterReconstruct.user : null;
      }
    }

    return impersonation ? impersonation.user : null;
  }  /**
   * Handle tab closed event - update badges but don't stop impersonation
   * since it's environment-based and should persist
   */
  async handleTabClosed(tabId: number): Promise<void> {
    // With environment-based impersonation, we don't clean up when tabs close
    // The impersonation persists for the environment URL
    console.log('🗑️ [TAB_CLOSED] Tab closed:', tabId, '(impersonation persists for environment)');
  }

  /**
   * Get debug information about current impersonation state
   */
  async getDebugInfo(): Promise<any> {
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

    return {
      environmentImpersonations: Array.from(this.environmentImpersonations.entries()),
      dynamicRules: dynamicRules,
      nextRuleId: this.nextRuleId,
      totalActiveRules: dynamicRules.length,
    };
  }

  /**
   * Clean up on extension startup/install - clears impersonation on browser restart
   */
  async initializeOnStartup(): Promise<void> {
    try {
      // Clear existing dynamic rules and memory on browser restart
      await this.clearAllDynamicRules();
      this.environmentImpersonations.clear();
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
      await this.clearAllDynamicRules();
      this.environmentImpersonations.clear();
      // Reset rule ID counter
      this.nextRuleId = 1;
      // Clear all badges
      await this.clearAllBadges();
      console.log('🧹 Force cleanup completed - all impersonation state cleared');
    } catch (error) {
      console.error('Error during force cleanup:', error);
    }
  }

  /**
   * Reset impersonation for a specific environment - removes headers but keeps rule structure
   * Useful when headers get stuck
   */
  async resetImpersonation(environmentUrl: string): Promise<void> {
    console.log('🔍 [resetImpersonation] Called with URL:', environmentUrl, 'Type:', typeof environmentUrl);

    // Extract hostname from environment URL
    let hostname: string;
    try {
      if (!environmentUrl) {
        throw new Error('Environment URL is undefined or empty');
      }

      // Convert to string in case it's not
      const urlString = String(environmentUrl);

      if (!/^https?:\/\//i.test(urlString)) {
        throw new Error(`URL does not start with http:// or https://: ${urlString}`);
      }

      const urlObj = new URL(urlString);
      hostname = urlObj.hostname;
      console.log('✅ [resetImpersonation] Extracted hostname:', hostname);
    } catch (e) {
      console.error('❌ [resetImpersonation] URL validation failed:', e);
      console.warn('[ImpersonationService] Invalid URL for reset:', environmentUrl);
      throw new Error(`Cannot reset impersonation - invalid environment URL: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Stop impersonation for this environment
    await this.stopImpersonationForEnvironment(hostname);
    console.log('🔄 Reset impersonation for environment:', hostname);
  }

  private async stopImpersonationForEnvironment(hostname: string): Promise<void> {
    const impersonation = this.environmentImpersonations.get(hostname);

    if (impersonation) {
      try {
        // Remove Chrome dynamic rule
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [impersonation.ruleId],
        });
        console.log('🎭 Removed dynamic rule:', impersonation.ruleId, 'for environment:', hostname);
      } catch (error) {
        console.error('Error removing dynamic rule:', impersonation.ruleId, error);
        // Still continue to clean up memory even if rule removal failed
      }

      // Remove from memory
      this.environmentImpersonations.delete(hostname);

      // Clear badges for all tabs with this environment
      await this.clearBadgesForEnvironment(hostname);

      console.log('🎭 Impersonation stopped for environment:', hostname);
    } else {
      console.log('🎭 No impersonation found for environment:', hostname);
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

  private async createDynamicRule(impersonation: EnvironmentImpersonation): Promise<void> {
    // Use appropriate header based on environment type
    // Online: CallerObjectId with Azure AD Object ID
    // On-Premises: MSCRMCalledId with System User ID
    const headerName = impersonation.isOnPremises ? 'MSCRMCalledId' : 'CallerObjectId';
    const headerValue = impersonation.isOnPremises
      ? impersonation.user.systemuserid
      : impersonation.user.azureactivedirectoryobjectid;

    const rule: chrome.declarativeNetRequest.Rule = {
      id: impersonation.ruleId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: headerName,
            value: headerValue,
          },
        ],
      },
      condition: {
        urlFilter: `https://${impersonation.hostname}/api/data/v*`,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ]
      },
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [rule],
    });

    console.log('📝 Created dynamic rule:', rule.id, 'for', impersonation.isOnPremises ? 'On-Premises' : 'Online', 'environment:', impersonation.hostname, 'using', headerName);
  }

  private async clearAllDynamicRules(): Promise<void> {
    try {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      if (existingRules.length > 0) {
        const existingRuleIds = existingRules.map(rule => rule.id);
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
        console.log(
          '🧹 Cleared',
          existingRuleIds.length,
          'existing dynamic rules:',
          existingRuleIds
        );
      } else {
        console.log('✅ No existing dynamic rules to clear');
      }

      // Clear all badges
      await this.clearAllBadges();

      this.environmentImpersonations.clear();
      this.nextRuleId = 1;
    } catch (error) {
      console.error('Error clearing dynamic rules:', error);
      // If there's an error, try to clear them individually
      try {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        for (const rule of rules) {
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
      await this.clearAllBadges();
      this.environmentImpersonations.clear();
      this.nextRuleId = 1;
    }
  }

  /**
   * Update badges for all tabs that match a specific environment
   */
  private async updateBadgesForEnvironment(hostname: string): Promise<void> {
    const impersonation = this.environmentImpersonations.get(hostname);
    if (!impersonation) return;

    const initials = this.computeInitials(impersonation.user.fullname || '');
    const title = `Impersonating ${impersonation.user.fullname}`;

    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          try {
            const tabUrl = new URL(tab.url);
            if (tabUrl.hostname === hostname) {
              await this.setActionBadgeForTab(tab.id, initials, title);
            }
          } catch (e) {
            // ignore invalid URLs
          }
        }
      }
    } catch (e) {
      console.error('Error updating badges for environment:', e);
    }
  }

  /**
   * Update badges for all tabs based on their environments
   */
  private async updateBadgesForAllTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          try {
            const tabUrl = new URL(tab.url);
            const impersonation = this.environmentImpersonations.get(tabUrl.hostname);
            if (impersonation) {
              const initials = this.computeInitials(impersonation.user.fullname || '');
              await this.setActionBadgeForTab(
                tab.id,
                initials,
                `Impersonating ${impersonation.user.fullname}`
              );
            } else {
              await this.clearActionBadgeForTab(tab.id);
            }
          } catch (e) {
            // ignore invalid URLs
          }
        }
      }
    } catch (e) {
      console.error('Error updating badges for all tabs:', e);
    }
  }

  /**
   * Clear badges for all tabs that match a specific environment
   */
  private async clearBadgesForEnvironment(hostname: string): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          try {
            const tabUrl = new URL(tab.url);
            if (tabUrl.hostname === hostname) {
              await this.clearActionBadgeForTab(tab.id);
            }
          } catch (e) {
            // ignore invalid URLs
          }
        }
      }
    } catch (e) {
      console.error('Error clearing badges for environment:', e);
    }
  }

  /**
   * Clear all badges for all tabs
   */
  private async clearAllBadges(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await this.clearActionBadgeForTab(tab.id);
          } catch (e) {
            // ignore individual badge clear errors
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

// Singleton instance
export const impersonationService = new ImpersonationService();
