// Admin actions module for Dynamics 365 administration

/// <reference types="xrm" />

import { WebApiClient } from './webapi-client';

interface ImpersonationUser {
  systemuserid: string;
  azureactivedirectoryobjectid: string;
  fullname: string;
  internalemailaddress: string;
  domainname: string;
}

interface SearchResult {
  users: ImpersonationUser[];
  hasMoreResults: boolean;
  totalResultsMessage?: string;
}

// Global variable to store current impersonation
let currentImpersonationUser: ImpersonationUser | null = null;

export class AdminActions {
  /**
   * Get environment information
   */
  static getEnvironmentInfo(): Record<string, unknown> {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const organizationSettings = globalContext.organizationSettings;
      const version = globalContext.getVersion();

      const envInfo = {
        organizationGeo: organizationSettings.organizationGeo,
        organizationId: organizationSettings.organizationId,
        uniqueName: organizationSettings.uniqueName,
        version: version,
        clientUrl: globalContext.getClientUrl(),
        currentUserId: globalContext.userSettings.userId,
        currentUserName: globalContext.userSettings.userName,
        organizationLanguageId: organizationSettings.languageId,
        isOnPremise: globalContext.isOnPremise,
        webResourceUrl: globalContext.getWebResourceUrl(''),
      };

      return envInfo;
    } catch (error) {
      throw new Error(
        `Failed to get environment information: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current user information
   */
  static getCurrentUserInfo(): Record<string, unknown> {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const userSettings = globalContext.userSettings;

      const userInfo = {
        userId: userSettings.userId,
        userName: userSettings.userName,
        languageId: userSettings.languageId,
        securityRoles: userSettings.securityRoles,
        defaultDashboardId: userSettings.defaultDashboardId,
      };

      return userInfo;
    } catch (error) {
      throw new Error(
        `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if the current user has a specific privilege
   */
  static async checkUserPrivilege(privilegeName: string): Promise<boolean> {
    // Ensure Xrm context is available
    if (typeof Xrm === 'undefined' || !Xrm.Utility) {
      throw new Error('Xrm context not available');
    }

    // For the specific case of impersonation privilege, use FetchXML to check
    if (privilegeName === 'prvActOnBehalfOfAnotherUser') {
      const fetchXml = `
        <fetch count="1">
          <entity name="roleprivileges">
            <link-entity name="role" from="roleid" to="roleid">
              <attribute name="name" />
              <attribute name="isinherited" />
              <link-entity name="systemuserroles" from="roleid" to="roleid" intersect="true">
                <filter>
                  <condition attribute="systemuserid" operator="eq-userid" />
                </filter>
              </link-entity>
            </link-entity>
            <link-entity name="privilege" from="privilegeid" to="privilegeid" link-type="inner">
              <filter>
                <condition attribute="name" operator="eq" value="${privilegeName}" />
              </filter>
            </link-entity>
          </entity>
        </fetch>
      `;

      try {
        const webApiClient = WebApiClient.getInstance();
        const result = await webApiClient.executeFetchXml('roleprivilegescollection', fetchXml);

        // If we get any results, the user has the privilege
        return result && result.entities && result.entities.length > 0;
      } catch (fetchError) {
        // Fallback to role name check if FetchXML fails
        try {
          const globalContext = Xrm.Utility.getGlobalContext();
          const userRoles = globalContext.userSettings
            .roles as Xrm.Collection.ItemCollection<Xrm.LookupValue>;

          if (!userRoles || userRoles.getLength() === 0) {
            return false;
          }

          // Check if user is a system administrator (usually has all privileges)
          for (let i = 0; i < userRoles.getLength(); i++) {
            const role = userRoles.get(i);
            const roleName = role.name?.toLowerCase();

            // System Administrator role typically has all privileges including impersonation
            if (roleName === 'system administrator') {
              return true;
            }
          }

          return false;
        } catch (roleError) {
          // If both FetchXML and role check fail, throw the original error
          throw fetchError;
        }
      }
    }
    // For other privileges, implement as needed
    return false;
  }

  /**
   * Get organization settings
   */
  static getOrganizationSettings(): Record<string, unknown> {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const orgSettings = globalContext.organizationSettings;

      const settings = {
        organizationId: orgSettings.organizationId,
        uniqueName: orgSettings.uniqueName,
        languageId: orgSettings.languageId,
        organizationGeo: orgSettings.organizationGeo,
        baseCurrencyId: orgSettings.baseCurrencyId,
        defaultCountryCode: orgSettings.defaultCountryCode,
        isAutoSaveEnabled: orgSettings.isAutoSaveEnabled,
      };

      return settings;
    } catch (error) {
      throw new Error(
        `Failed to get organization settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get client information
   */
  static getClientInfo(): Record<string, unknown> {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();

      const clientInfo = {
        client: globalContext.client,
        clientUrl: globalContext.getClientUrl(),
        currentTheme: globalContext.getCurrentTheme(),
        isOnPremise: globalContext.isOnPremise,
        organizationUrl: globalContext.getClientUrl(),
        version: globalContext.getVersion(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      return clientInfo;
    } catch (error) {
      throw new Error(
        `Failed to get client information: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for users by name or email with result truncation notifications
   */
  static async searchUsers(query: string): Promise<SearchResult> {
    try {
      console.log('🔍 [AdminActions] searchUsers called with query:', query);
      const webApiClient = WebApiClient.getInstance();
      console.log('🔍 [AdminActions] Got WebApiClient instance, calling searchUsers...');
      const result = await webApiClient.searchUsers(query);
      console.log('🔍 [AdminActions] WebApiClient.searchUsers returned:', result);
      console.log('🔍 [AdminActions] Result users array length:', result?.users?.length);
      return result;
    } catch (error) {
      console.error('🔍 [AdminActions] Error searching users:', error);
      throw new Error(
        `Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Start impersonation for a specific user
   */
  static startImpersonation(user: ImpersonationUser): boolean {
    try {
      if (!user.azureactivedirectoryobjectid) {
        throw new Error('User does not have an Azure AD Object ID');
      }

      currentImpersonationUser = user;
      console.log(
        'Started impersonating user:',
        user.fullname,
        'with Azure AD ID:',
        user.azureactivedirectoryobjectid
      );

      // Note: Actual header injection is now handled by the background script via declarativeNetRequest
      // This is more secure and reliable than function overriding

      return true;
    } catch (error) {
      console.error('Error starting impersonation:', error);
      throw new Error(
        `Failed to start impersonation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop impersonation
   */
  static stopImpersonation(): boolean {
    try {
      currentImpersonationUser = null;
      console.log('Stopped impersonation');
      return true;
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      throw new Error(
        `Failed to stop impersonation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current impersonation status
   */
  static getCurrentImpersonation(): ImpersonationUser | null {
    return currentImpersonationUser;
  }
}
