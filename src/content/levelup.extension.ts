/// <reference types="xrm" />

declare global {
  interface Window {
    levelUpExtension: LevelUpExtension;
  }
}

interface Solution {
  uniquename: string;
  friendlyname: string;
  solutionid: string;
  version: string;
  ismanaged: boolean;
}

import {
  FormActionName,
  EntityMetadata,
  EntityMetadataCache,
  ActionMessage,
  DynamicsAction,
  AdminActionName,
  DebuggingActionName,
  NavigationActionName,
} from '#types/global';
import { CustomCommand } from '#types/custom-commands';
import { FormActions } from './modules/form-actions';
import { NavigationActions } from './modules/navigation-actions';
import { AdminActions } from './modules/admin-actions';
import { DebuggingActions } from './modules/debugging-actions';
import { CustomCommandsExecutor } from './modules/custom-commands';
import { WebApiClient } from './modules/webapi-client';
import { DynamicsUtils } from './modules/utils';

/**
 * Configuration for action method mapping
 */
interface ActionMethodConfig {
  actionName: string;
  method: string;
  dataTransformer?: (data: unknown) => unknown;
}

export class LevelUpExtension {
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private cacheKey: string = 'levelup_entity_metadata_cache'; // Default, will be updated in init
  private formActions: FormActions;
  private debuggingActions: DebuggingActions;

  constructor() {
    this.formActions = new FormActions(this);
    this.debuggingActions = new DebuggingActions();
    this.init();
  }

  /**
   * Action method mappings for different action groups
   */
  private getFormActionMappings(): ActionMethodConfig[] {
    return [
      { actionName: 'show-logical-names', method: 'showLogicalNames' },
      { actionName: 'clear-logical-names', method: 'clearLogicalNames' },
      { actionName: 'god-mode', method: 'enableGodMode' },
      { actionName: 'changed-fields', method: 'highlightChangedFields' },
      { actionName: 'record-url', method: 'getRecordUrl' },
      { actionName: 'record-id', method: 'getRecordId' },
      { actionName: 'open-web-api', method: 'openWebApiRecord' },
      { actionName: 'refresh-subgrids', method: 'refreshAllSubgrids' },
      { actionName: 'show-optionset-values', method: 'showOptionSetValues' },
      { actionName: 'clone-record', method: 'cloneRecord' },
      { actionName: 'refresh-autosave-off', method: 'refreshWithoutSave' },
      { actionName: 'all-fields', method: 'showAllFields' },
      { actionName: 'open-editor', method: 'openFormEditor' },
      { actionName: 'table-processes', method: 'showTableProcesses' },
    ];
  }

  private getNavigationActionMappings(): ActionMethodConfig[] {
    return [
      {
        actionName: 'open-record-by-id',
        method: 'openRecordById',
        dataTransformer: data => data as { entityName: string; recordId: string },
      },
      {
        actionName: 'new-record',
        method: 'createNewRecord',
        dataTransformer: data => data as { entityName: string },
      },
      {
        actionName: 'open-list',
        method: 'openEntityList',
        dataTransformer: data => data as { entityName: string },
      },
      { actionName: 'open-security', method: 'openSecurity' },
      { actionName: 'open-system-jobs', method: 'openSystemJobs' },
      { actionName: 'open-solutions', method: 'openSolutions' },
      { actionName: 'open-processes', method: 'openProcesses' },
      { actionName: 'open-mailboxes', method: 'openMailboxes' },
      { actionName: 'open-main', method: 'openMain' },
      { actionName: 'open-advanced-find', method: 'openAdvancedFind' },
      { actionName: 'open-mobile-client', method: 'openMobileClient' },
      { actionName: 'open-power-platform-admin', method: 'openPowerPlatformAdmin' },
      { actionName: 'open-solutions-history', method: 'openSolutionsHistory' },
      { actionName: 'pin-to-side-panel', method: 'pinToSidePanel' },
    ];
  }

  private getAdminActionMappings(): ActionMethodConfig[] {
    return [
      { actionName: 'get-user-info', method: 'getCurrentUserInfo' },
      { actionName: 'get-organization-settings', method: 'getOrganizationSettings' },
      { actionName: 'get-client-info', method: 'getClientInfo' },
    ];
  }

  private getDebuggingActionMappings(): ActionMethodConfig[] {
    return [
      { actionName: 'forms-monitor', method: 'enableFormsMonitor' },
      { actionName: 'ribbon-debugger', method: 'enableRibbonDebugger' },
      { actionName: 'perf-center', method: 'enablePerfCenter' },
      { actionName: 'disable-form-handlers', method: 'disableFormHandlers' },
      { actionName: 'disable-business-rules', method: 'disableBusinessRules' },
      { actionName: 'disable-form-libraries', method: 'disableFormLibraries' },
      { actionName: 'enable-dark-mode', method: 'enableDarkMode' },
      { actionName: 'clear-flags', method: 'clearFlags' },
    ];
  }

  private init(): void {
    // Wait for Xrm to be available
    this.waitForXrm().then(async () => {
      // Set environment-specific cache key
      this.initializeCacheKey();

      this.setupMessageListener();

      // Proactively populate entity metadata cache on first load
      try {
        const cached = this.getCachedEntityMetadata();
        if (!cached) {
          // eslint-disable-next-line no-console
          console.log('Level Up: No cached entity metadata found, populating cache...');
          await this.getEntityMetadata();
        } else {
          // eslint-disable-next-line no-console
          console.log('Level Up: Using existing cached entity metadata');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Level Up: Failed to populate entity metadata cache on init:', error);
      }

      // eslint-disable-next-line no-console
      console.log('Level Up: Dynamics 365 Client API integration ready');
    });
  }

  /**
   * Initialize cache key based on the current Dynamics 365 environment URL
   */
  private initializeCacheKey(): void {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const clientUrl = globalContext.getClientUrl();

      // Create a clean cache key from the environment URL
      const url = new URL(clientUrl);
      const hostname = url.hostname.toLowerCase();

      // Use hostname as part of cache key for environment isolation
      this.cacheKey = `levelup_entity_metadata_${hostname}`;

      console.log(`Level Up: Cache key set for environment: ${hostname}`);
    } catch (error) {
      console.warn('Level Up: Failed to get environment URL, using default cache key:', error);
      this.cacheKey = 'levelup_entity_metadata_cache';
    }
  }

  private waitForXrm(): Promise<void> {
    return new Promise(resolve => {
      const checkXrm = () => {
        try {
          if (
            typeof Xrm !== 'undefined' &&
            Xrm.Utility &&
            typeof Xrm.Utility.getGlobalContext === 'function'
          ) {
            // Test if we can actually call the function
            Xrm.Utility.getGlobalContext();
            resolve();
          } else {
            setTimeout(checkXrm, 100);
          }
        } catch (error) {
          setTimeout(checkXrm, 100);
        }
      };
      checkXrm();
    });
  }

  private isValidActionMessage(data: unknown): data is ActionMessage {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;
    return (
      obj.type === 'LEVELUP_REQUEST' &&
      typeof obj.action === 'string' &&
      typeof obj.requestId === 'string'
    );
  }

  private setupMessageListener(): void {
    window.addEventListener('message', async event => {
      if (event.source !== window) {
        return;
      }

      if (this.isValidActionMessage(event.data)) {
        await this.handleAction(event.data);
      } else if (
        event.data &&
        event.data.type === 'GET_ENTITY_METADATA_REQUEST' &&
        event.data.requestId
      ) {
        await this.handleGetEntities(event.data.requestId);
      } else if (
        event.data &&
        event.data.type === 'GET_PAGE_CONTEXT_REQUEST' &&
        event.data.requestId
      ) {
        this.handleGetPageContext(event.data.requestId);
      }
    });
  }

  /**
   * Get cached entity metadata from localStorage
   */
  private getCachedEntityMetadata(): EntityMetadataCache | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as EntityMetadataCache;
      if (parsed && parsed.entities && parsed.timestamp) {
        return parsed;
      }
    } catch (error) {
      console.warn('Level Up: Failed to parse cached entity metadata:', error);
      localStorage.removeItem(this.cacheKey);
    }
    return null;
  }

  /**
   * Save entity metadata to localStorage
   */
  private setCachedEntityMetadata(entities: EntityMetadata[]): void {
    try {
      const cacheData: EntityMetadataCache = {
        entities: entities,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Level Up: Failed to cache entity metadata:', error);
    }
  }

  private async handleGetEntities(requestId: string): Promise<void> {
    try {
      // Use the Dynamics 365 Web API to get entity metadata
      const entities = await this.getEntityMetadata();

      // Send response back to content script
      window.postMessage(
        {
          type: 'GET_ENTITY_METADATA_RESPONSE',
          requestId: requestId,
          success: true,
          entities: entities,
        },
        window.location.origin
      );
    } catch (error) {
      console.error('Failed to get entities');
    }
  }

  private async getEntityMetadata(): Promise<EntityMetadata[] | undefined> {
    try {
      // Check if we have cached data that's still valid
      const cached = this.getCachedEntityMetadata();
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_DURATION_MS) {
        console.log('Level Up: Using cached entity metadata from localStorage');
        return cached.entities;
      }

      console.log('Level Up: Fetching fresh entity metadata from API');

      // Use the existing WebApiClient to get entity metadata
      const webApiClient = WebApiClient.getInstance();

      // Make a Web API request to get entity metadata using the WebApiClient
      const response = (await webApiClient.retrieveMultiple('EntityDefinitions', {
        select: [
          'LogicalName',
          'DisplayName',
          'LogicalCollectionName',
          'IconSmallName',
          'IconMediumName',
          'IconLargeName',
          'ObjectTypeCode',
        ],
        filter: 'IsValidForAdvancedFind eq true',
      })) as { value: EntityMetadata[] };

      const entities = response.value || [];

      // Cache the results in localStorage
      this.setCachedEntityMetadata(entities);

      console.log(`Level Up: Cached ${entities.length} entities in localStorage`);
      return entities;
    } catch (error) {
      console.error('Error fetching entity metadata:', error);

      // If we have cached data, return it even if it's expired
      const cached = this.getCachedEntityMetadata();
      if (cached) {
        console.log('Level Up: API failed, using expired cached entity metadata from localStorage');
        return cached.entities;
      }
    }
  }

  private async handleAction(message: ActionMessage): Promise<void> {
    const { action, data, requestId } = message;

    try {
      let result: unknown = null;

      // Parse action into group and actionName (format: "group:actionName")
      const [group, actionName] = action.split(':', 2) as [string, DynamicsAction];

      switch (group) {
        case 'form':
          result = await this.handleFormAction(actionName as FormActionName, data);
          break;
        case 'navigation':
          result = await this.handleNavigationAction(actionName as NavigationActionName, data);
          break;
        case 'admin':
          result = await this.handleAdminAction(actionName as AdminActionName, data);
          break;
        case 'debugging':
          result = await this.handleDebuggingAction(actionName as DebuggingActionName, data);
          break;
        case 'custom':
          result = await this.handleCustomCommandAction(actionName, data);
          break;
      }

      // Check if result has error information (for form actions context errors)
      if (
        result &&
        typeof result === 'object' &&
        'error' in result &&
        'success' in result &&
        !(result as { success: boolean }).success
      ) {
        this.sendResponse(requestId, result);
      } else {
        this.sendResponse(requestId, { success: true, data: result });
      }
    } catch (error) {
      this.sendResponse(requestId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generic method executor for action mappings
   */
  private async executeActionMethod(
    target: unknown,
    mappings: ActionMethodConfig[],
    actionName: string,
    data: unknown
  ): Promise<unknown> {
    const config = mappings.find(m => m.actionName === actionName);
    if (!config) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    const method = (target as Record<string, Function>)[config.method];
    if (typeof method !== 'function') {
      throw new Error(`Method ${config.method} not found on target object`);
    }

    const transformedData = config.dataTransformer ? config.dataTransformer(data) : undefined;
    return await method.call(target, transformedData);
  }

  private async handleFormAction(actionName: FormActionName, data: unknown): Promise<unknown> {
    const isFormCtx = DynamicsUtils.isFormContext();

    if (isFormCtx) {
      // Handle all form actions through the FormActions class
      return this.executeActionMethod(
        this.formActions,
        this.getFormActionMappings(),
        actionName,
        data
      );
    } else {
      // Return a user-friendly error message instead of throwing
      return {
        error:
          'Form actions can only be used in the context of a form. You are currently on a different page type.',
        success: false,
      };
    }
  }

  private async handleNavigationAction(
    actionName: NavigationActionName,
    data: unknown
  ): Promise<unknown> {
    return this.executeActionMethod(
      NavigationActions,
      this.getNavigationActionMappings(),
      actionName,
      data
    );
  }

  private async handleDebuggingAction(
    actionName: DebuggingActionName,
    data: unknown
  ): Promise<unknown> {
    return this.executeActionMethod(
      this.debuggingActions,
      this.getDebuggingActionMappings(),
      actionName,
      data
    );
  }

  private async handleAdminAction(actionName: AdminActionName, data: unknown): Promise<unknown> {
    // Handle special cases that don't fit the standard pattern
    switch (actionName) {
      case 'check-user-privilege':
        if (data && typeof data === 'object' && 'privilegeName' in data) {
          const privilegeData = data as { privilegeName: string };
          return await AdminActions.checkUserPrivilege(privilegeData.privilegeName);
        } else {
          throw new Error(
            'Invalid data for check-user-privilege action: privilegeName is required'
          );
        }
      case 'search-users':
        if (data && typeof data === 'object' && 'query' in data) {
          const searchData = data as { query: string };
          const result = await AdminActions.searchUsers(searchData.query);
          console.log('[levelup.extension] AdminActions.searchUsers returned:', result);
          return result;
        } else {
          throw new Error('Invalid data for search-users action: query is required');
        }
      case 'start-impersonation':
      case 'stop-impersonation':
      case 'get-impersonation-status':
        throw new Error('Impersonation actions should be handled by background script');
      default:
        // Handle standard admin actions using the mapping
        return this.executeActionMethod(
          AdminActions,
          this.getAdminActionMappings(),
          actionName,
          data
        );
    }
  }

  private async handleCustomCommandAction(actionName: string, data: unknown): Promise<unknown> {
    if (actionName === 'execute') {
      if (data && typeof data === 'object' && 'command' in data) {
        const executionData = data as { command: CustomCommand };
        return await CustomCommandsExecutor.executeCommand(executionData.command);
      } else {
        throw new Error('Invalid data for custom command execution: command is required');
      }
    } else {
      throw new Error(`Unknown custom command action: ${actionName}`);
    }
  }

  /**
   * Get current record information from Xrm context or URL
   */
  private getCurrentRecordInfo(): {
    entityType: string;
    entityId: string;
    entityLogicalName: string;
  } | null {
    try {
      // Method 1: Try to get from Xrm.Page (deprecated but still works)
      if (typeof Xrm !== 'undefined' && Xrm.Page?.data?.entity) {
        const entity = Xrm.Page.data.entity;
        return {
          entityType: entity.getEntityName(),
          entityId: entity.getId().replace(/[{}]/g, ''),
          entityLogicalName: entity.getEntityName(),
        };
      }

      // Method 2: Try to get from modern Xrm.Utility
      if (typeof Xrm !== 'undefined' && Xrm.Utility?.getGlobalContext) {
        const globalContext = Xrm.Utility.getGlobalContext();
        const pageContext = globalContext.getCurrentAppUrl
          ? globalContext.getCurrentAppUrl()
          : window.location.href;

        const urlParams = new URLSearchParams(new URL(pageContext).search);
        const entityType = urlParams.get('etn');
        const entityId = urlParams.get('id');

        if (entityType && entityId) {
          return {
            entityType: entityType,
            entityId: entityId.replace(/[{}]/g, ''),
            entityLogicalName: entityType,
          };
        }
      }

      // Method 3: Parse from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const entityType = urlParams.get('etn');
      const entityId = urlParams.get('id');

      if (entityType && entityId) {
        return {
          entityType: entityType,
          entityId: entityId.replace(/[{}]/g, ''),
          entityLogicalName: entityType,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting current record info:', error);
      return null;
    }
  }

  /**
   * Get user's preferred solution using WebAPI client
   */
  public async getPreferredSolution(): Promise<Solution | null> {
    try {
      const webApiClient = WebApiClient.getInstance();

      // Use the WebAPI client to call the GetPreferredSolution function
      const response = await webApiClient.executeFunction('GetPreferredSolution');

      if (response && typeof response === 'object') {
        const solutionResponse = response as Record<string, unknown>;
        return {
          uniquename: solutionResponse.uniquename as string,
          friendlyname: solutionResponse.friendlyname as string,
          solutionid: solutionResponse.solutionid as string,
          version: solutionResponse.version as string,
          ismanaged: solutionResponse.ismanaged as boolean,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get solution by name using WebAPI client
   */
  private async getSolutionByName(solutionName: string): Promise<Solution | null> {
    try {
      const webApiClient = WebApiClient.getInstance();

      // Use the WebAPI client to query solutions
      const solutions = await webApiClient.retrieveMultiple('solutions', {
        filter: `uniquename eq '${encodeURIComponent(solutionName)}'`,
        select: ['solutionid', 'uniquename', 'friendlyname', 'version', 'ismanaged'],
      });

      if (solutions && solutions.value && solutions.value.length > 0) {
        const solution = solutions.value[0] as Record<string, unknown>;
        return {
          uniquename: solution.uniquename as string,
          friendlyname: solution.friendlyname as string,
          solutionid: solution.solutionid as string,
          version: solution.version as string,
          ismanaged: solution.ismanaged as boolean,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the Default solution as fallback when no preferred solution is available
   */
  public async getDefaultSolution(): Promise<Solution | null> {
    try {
      const webApiClient = WebApiClient.getInstance();

      // Query for the Default solution specifically
      const solutions = await webApiClient.retrieveMultiple('solutions', {
        filter: "uniquename eq 'Default'",
        select: ['solutionid', 'uniquename', 'friendlyname', 'version', 'ismanaged'],
      });

      if (solutions && solutions.value && solutions.value.length > 0) {
        const solution = solutions.value[0] as Record<string, unknown>;
        return {
          uniquename: solution.uniquename as string,
          friendlyname: (solution.friendlyname as string) || 'Default Solution',
          solutionid: solution.solutionid as string,
          version: solution.version as string,
          ismanaged: solution.ismanaged as boolean,
        };
      }

      // If Default solution not found, try to get any unmanaged solution
      const unmangedSolutions = await webApiClient.retrieveMultiple('solutions', {
        filter: 'ismanaged eq false',
        select: ['solutionid', 'uniquename', 'friendlyname', 'version', 'ismanaged'],
        orderBy: ['createdon'],
        top: 1,
      });

      if (unmangedSolutions && unmangedSolutions.value && unmangedSolutions.value.length > 0) {
        const solution = unmangedSolutions.value[0] as Record<string, unknown>;
        return {
          uniquename: solution.uniquename as string,
          friendlyname: (solution.friendlyname as string) || (solution.uniquename as string),
          solutionid: solution.solutionid as string,
          version: solution.version as string,
          ismanaged: solution.ismanaged as boolean,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get entity metadata from existing cache
   */
  private async getEntityMetadataFromCache(
    logicalName: string
  ): Promise<{ entityId: string; logicalName: string; displayName: string } | null> {
    try {
      console.log('Getting entity metadata from existing cache for:', logicalName);

      // Use the existing getCachedEntityMetadata method
      const cached = this.getCachedEntityMetadata();

      if (cached && cached.entities) {
        // Find the entity in the cached entities
        const entityMetadata = cached.entities.find(
          entity => entity.LogicalName.toLowerCase() === logicalName.toLowerCase()
        );

        if (entityMetadata) {
          return {
            entityId:
              (entityMetadata as any).MetadataId ||
              `entity-${(entityMetadata as any).ObjectTypeCode || entityMetadata.LogicalName}`,
            logicalName: entityMetadata.LogicalName,
            displayName:
              entityMetadata.DisplayName?.UserLocalizedLabel?.Label || entityMetadata.LogicalName,
          };
        }

        console.log(
          'Entity not found in cache, available entities:',
          cached.entities.map(e => e.LogicalName).join(', ')
        );
      }

      // Fallback: refresh cache and try again
      console.log('Entity not in cache, refreshing cache');
      const entities = await this.getEntityMetadata();

      if (entities) {
        const entityMetadata = entities.find(
          entity => entity.LogicalName.toLowerCase() === logicalName.toLowerCase()
        );

        if (entityMetadata) {
          return {
            entityId:
              (entityMetadata as any).MetadataId ||
              `entity-${(entityMetadata as any).ObjectTypeCode || entityMetadata.LogicalName}`,
            logicalName: entityMetadata.LogicalName,
            displayName:
              entityMetadata.DisplayName?.UserLocalizedLabel?.Label || entityMetadata.LogicalName,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting entity metadata from cache:', error);
      return null;
    }
  }

  /**
   * Construct Power Platform maker portal form editor URL
   */
  private constructPowerPlatformFormEditorUrl(
    environmentInfo: { environmentId: string },
    solutionInfo: { solutionid: string },
    entityMetadata: { entityId: string },
    formId?: string
  ): string {
    // Power Platform maker portal URL format:
    // https://make.powerapps.com/environments/{environmentId}/solutions/{solutionId}/entities/{entityId}/forms
    const baseUrl = 'https://make.powerapps.com';

    let url = `${baseUrl}/environments/${environmentInfo.environmentId}/solutions/${solutionInfo.solutionid}/entities/${entityMetadata.entityId}/forms`;

    // If a specific form ID is provided, append it
    if (formId) {
      url += `/${formId}`;
    }

    return url;
  }

  private sendResponse(requestId: string | undefined, response: unknown): void {
    const responseData =
      typeof response === 'object' && response !== null ? response : { data: response };

    console.log('[levelup.extension] responseData:', responseData);

    const messageData = {
      type: 'LEVELUP_RESPONSE',
      requestId,
      ...responseData,
    };

    console.log('[levelup.extension] Sending message:', messageData);

    window.postMessage(messageData, window.location.origin);

    console.log('[levelup.extension] Message posted to window');
  }

  /**
   * Handle request for page context from sidebar
   */
  private handleGetPageContext(requestId: string): void {
    try {
      let pageContext = null;

      // Check if Xrm is available and get page context
      if (typeof Xrm !== 'undefined' && Xrm.Utility?.getPageContext) {
        pageContext = Xrm.Utility.getPageContext().input;
      }

      // Send response back to content script
      window.postMessage(
        {
          type: 'GET_PAGE_CONTEXT_RESPONSE',
          requestId: requestId,
          pageContext: pageContext,
        },
        window.location.origin
      );
    } catch (error) {
      // Send error response
      window.postMessage(
        {
          type: 'GET_PAGE_CONTEXT_RESPONSE',
          requestId: requestId,
          pageContext: null,
        },
        window.location.origin
      );
    }
  }
}

// Create the extension instance
const levelUpExtension = new LevelUpExtension();

// Add to window object for access from extension code
window.levelUpExtension = levelUpExtension;
