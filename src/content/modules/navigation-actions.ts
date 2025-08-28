// Navigation actions module for Dynamics 365

/// <reference types="xrm" />

import { DynamicsUtils } from './utils';
import { EntityMetadata, EntityMetadataCache } from '#types/global';

export class NavigationActions {
  /**
   * Get entity metadata from cache for icon determination
   */
  private static getEntityMetadata(entityLogicalName: string): EntityMetadata | null {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const clientUrl = globalContext.getClientUrl();
      const url = new URL(clientUrl);
      const hostname = url.hostname.toLowerCase();
      const cacheKey = `levelup_entity_metadata_${hostname}`;

      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as EntityMetadataCache;
      if (parsed && parsed.entities && parsed.timestamp) {
        return (
          parsed.entities.find(
            entity => entity.LogicalName?.toLowerCase() === entityLogicalName?.toLowerCase()
          ) || null
        );
      }
    } catch (error) {
      // Silently handle cache errors to avoid breaking navigation actions
    }
    return null;
  }

  /**
   * Get appropriate icon URL for entity
   */
  private static getEntityIconUrl(entityLogicalName: string): string | null {
    const entityMetadata = this.getEntityMetadata(entityLogicalName);

    if (entityMetadata) {
      const globalContext = Xrm.Utility.getGlobalContext();
      const clientUrl = globalContext.getClientUrl();

      // If IconSmallName is not null, use it
      if (entityMetadata.IconSmallName) {
        return `${clientUrl}/Webresources/${entityMetadata.IconSmallName}`;
      }
      // If IconSmallName is null, use ObjectTypeCode
      if (entityMetadata.ObjectTypeCode) {
        return `${clientUrl}/_imgs/svg_${entityMetadata.ObjectTypeCode}.svg`;
      }
    }

    // Fallback to default icon
    return null;
  }

  /**
   * Open a record by entity name and ID
   */
  static openRecordById(data: { entityName: string; recordId: string }): string {
    const { entityName, recordId } = data;
    if (!entityName || !recordId) {
      throw new Error('Entity name and record ID are required');
    }

    return DynamicsUtils.openPage(
      {
        entityName,
        pageType: 'entityrecord',
        parameters: { id: recordId },
      },
      `Record opened: ${entityName} (${recordId})`
    );
  }

  /**
   * Create a new record for specified entity
   */
  static createNewRecord(data: { entityName: string }): string {
    const { entityName } = data;
    if (!entityName) {
      throw new Error('Entity name is required');
    }

    return DynamicsUtils.openPage(
      {
        entityName,
        pageType: 'entityrecord',
      },
      `New ${entityName} record window opened`
    );
  }

  /**
   * Open entity list view
   */
  static openEntityList(data: { entityName: string }): string {
    const { entityName } = data;
    if (!entityName) {
      throw new Error('Entity name is required');
    }

    return DynamicsUtils.openPage(
      {
        entityName,
        pageType: 'entitylist',
      },
      `${entityName} list opened`
    );
  }

  /**
   * Open Security area
   */
  static openSecurity(): string {
    const orgSettings = Xrm.Utility.getGlobalContext().organizationSettings;
    return DynamicsUtils.openPage(
      {
        url: `https://admin.powerplatform.microsoft.com/manage/environments/${orgSettings.organizationId}/${orgSettings.bapEnvironmentId}/users`,
      },
      'Security area opened'
    );
  }

  /**
   * Open System Jobs
   */
  static openSystemJobs(): string {
    return DynamicsUtils.openPage(
      {
        entityName: 'asyncoperation',
        pageType: 'entitylist',
      },
      'System jobs opened'
    );
  }

  /**
   * Open Solutions
   */
  static openSolutions(): string {
    return DynamicsUtils.openPage(
      {
        url: `https://make.powerapps.com/environments/${Xrm.Utility.getGlobalContext().organizationSettings.bapEnvironmentId}/solutions`,
      },
      'Solutions opened'
    );
  }

  /**
   * Open Processes
   */
  static openProcesses(): string {
    return DynamicsUtils.openPage(
      {
        entityName: 'workflow',
        pageType: 'entitylist',
      },
      'Processes opened'
    );
  }

  /**
   * Open Mailboxes
   */
  static openMailboxes(): string {
    return DynamicsUtils.openPage(
      {
        entityName: 'mailbox',
        pageType: 'entitylist',
      },
      'Mailboxes opened'
    );
  }

  /**
   * Open main Dynamics 365 page
   */
  static openMain(): string {
    return DynamicsUtils.openPage({}, 'Main page opened');
  }

  /**
   * Open Advanced Find
   */
  static openAdvancedFind(): string {
    return DynamicsUtils.openPage(
      {
        pageType: 'advancedfind',
      },
      'Advanced Find opened'
    );
  }

  /**
   * Open Mobile Client (MoCA)
   */
  static openMobileClient(): string {
    const orgUrl = DynamicsUtils.getOrganizationUrl();
    const globalContext = Xrm.Utility.getGlobalContext();
    return DynamicsUtils.openPage(
      {
        url: `${orgUrl}/nga/main.htm?org=${globalContext.organizationSettings.uniqueName}&server=${globalContext.getClientUrl()}`,
      },
      'Mobile client opened'
    );
  }

  /**
   * Open Power Platform Admin Center for current environment
   */
  static openPowerPlatformAdmin(): string {
    try {
      const orgSettings = Xrm.Utility.getGlobalContext().organizationSettings;

      // Use bapEnvironmentId if available, otherwise fall back to generic admin center
      if (orgSettings && orgSettings.bapEnvironmentId) {
        return DynamicsUtils.openPage(
          {
            url: `https://admin.powerplatform.microsoft.com/environments/environment/${orgSettings.bapEnvironmentId}/hub`,
          },
          'Power Platform Admin center opened for current environment'
        );
      } else {
        return DynamicsUtils.openPage(
          {
            url: 'https://admin.powerplatform.microsoft.com',
          },
          'Power Platform Admin center opened'
        );
      }
    } catch (error) {
      return DynamicsUtils.openPage(
        {
          url: 'https://admin.powerplatform.microsoft.com',
        },
        'Power Platform Admin center opened'
      );
    }
  }

  /**
   * Pin current view or record to side panel
   */
  static async pinToSidePanel(): Promise<string> {
    try {
      const pageInput = Xrm.Utility.getPageContext().input;
      const entityName = pageInput.entityName;

      // Get appropriate icon for the entity
      const iconUrl = this.getEntityIconUrl(entityName);
      const paneSettings: { canClose: boolean; imageSrc?: string } = {
        canClose: true,
        ...(iconUrl && { imageSrc: iconUrl }),
      };

      const pane = await Xrm.App.sidePanes.createPane(paneSettings);
      if (pageInput.pageType === 'entityrecord') {
        pane.navigate({
          pageType: pageInput.pageType,
          entityName: pageInput.entityName,
          entityId: pageInput.entityId,
        });
      } else {
        pane.navigate({
          pageType: pageInput.pageType,
          entityName: pageInput.entityName,
        });
      }

      return 'Current page pinned to side panel';
    } catch (error) {
      throw new Error(
        `Failed to pin to side panel: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Open Solutions History
   */
  static openSolutionsHistory(): string {
    return DynamicsUtils.openPage(
      {
        url: `https://make.powerapps.com/environments/${Xrm.Utility.getGlobalContext().organizationSettings.bapEnvironmentId}/solutionsHistory`,
      },
      'Solutions history opened'
    );
  }
}
