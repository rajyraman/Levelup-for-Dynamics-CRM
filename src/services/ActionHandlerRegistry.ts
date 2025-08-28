import { messageService } from './MessageService';
import { DynamicsAction, NavigationData, AdminData } from '#types/global';
import { CustomCommand } from '#types/custom-commands';
import { CustomCommandsService } from './CustomCommandsService';

interface ActionConfig {
  /** The action identifier (e.g., 'form:god-mode') */
  action: DynamicsAction;
  /** The method name to call in the content script */
  contentScriptMethod: string;
  /** Optional function to extract/transform data before passing to content script */
  dataExtractor?: (data: unknown) => unknown;
}

export class ActionHandlerRegistry {
  public static registerAllHandlers() {
    console.log('🚀 [ActionHandlerRegistry] Registering all action handlers...');

    // Form Actions
    this.registerFormHandlers();

    // Navigation Actions
    this.registerNavigationHandlers();

    // Admin Actions
    this.registerAdminHandlers();

    // Debugging Actions
    this.registerDebuggingHandlers();

    // Custom Commands
    this.registerCustomCommandHandlers();

    console.log(
      `✅ [ActionHandlerRegistry] Registered ${messageService.getStats().registeredHandlers} handlers`
    );
  }

  /**
   * Register handlers from action configurations
   * This centralizes the repetitive handler registration logic
   */
  private static registerHandlers(configs: ActionConfig[]) {
    configs.forEach(config => {
      messageService.registerHandler(config.action, async (data?: unknown) => {
        const extractedData = config.dataExtractor ? config.dataExtractor(data) : undefined;
        return await this.executeContentScript(config.action, extractedData);
      });
    });
  }

  private static registerFormHandlers() {
    const formConfigs: ActionConfig[] = [
      { action: 'form:show-logical-names', contentScriptMethod: 'showLogicalNames' },
      { action: 'form:clear-logical-names', contentScriptMethod: 'clearLogicalNames' },
      { action: 'form:god-mode', contentScriptMethod: 'enableGodMode' },
      { action: 'form:record-url', contentScriptMethod: 'getRecordUrl' },
      { action: 'form:record-id', contentScriptMethod: 'getRecordId' },
      { action: 'form:changed-fields', contentScriptMethod: 'highlightChangedFields' },
      { action: 'form:refresh-subgrids', contentScriptMethod: 'refreshAllSubgrids' },
      { action: 'form:show-optionset-values', contentScriptMethod: 'showOptionSetValues' },
      { action: 'form:clone-record', contentScriptMethod: 'cloneRecord' },
      { action: 'form:refresh-autosave-off', contentScriptMethod: 'refreshWithoutSave' },
      { action: 'form:open-web-api', contentScriptMethod: 'openWebApiRecord' },
      { action: 'form:all-fields', contentScriptMethod: 'showAllFields' },
      { action: 'form:open-editor', contentScriptMethod: 'openFormEditor' },
      { action: 'form:table-processes', contentScriptMethod: 'showTableProcesses' },
    ];

    this.registerHandlers(formConfigs);
  }

  /**
   * Register all navigation-related action handlers
   */
  private static registerNavigationHandlers() {
    const navigationConfigs: ActionConfig[] = [
      {
        action: 'navigation:open-record-by-id',
        contentScriptMethod: 'openRecordById',
        dataExtractor: data => {
          const navData = data as NavigationData;
          return { entityName: navData?.entityName, recordId: navData?.recordId };
        },
      },
      {
        action: 'navigation:new-record',
        contentScriptMethod: 'createNewRecord',
        dataExtractor: data => {
          const navData = data as NavigationData;
          return { entityName: navData?.entityName };
        },
      },
      {
        action: 'navigation:open-list',
        contentScriptMethod: 'openEntityList',
        dataExtractor: data => {
          const navData = data as NavigationData;
          return { entityName: navData?.entityName };
        },
      },
      { action: 'navigation:open-security', contentScriptMethod: 'openSecurity' },
      { action: 'navigation:open-system-jobs', contentScriptMethod: 'openSystemJobs' },
      { action: 'navigation:open-solutions', contentScriptMethod: 'openSolutions' },
      { action: 'navigation:open-processes', contentScriptMethod: 'openProcesses' },
      { action: 'navigation:open-mailboxes', contentScriptMethod: 'openMailboxes' },
      { action: 'navigation:open-main', contentScriptMethod: 'openMain' },
      { action: 'navigation:open-advanced-find', contentScriptMethod: 'openAdvancedFind' },
      { action: 'navigation:open-mobile-client', contentScriptMethod: 'openMobileClient' },
      { action: 'navigation:open-solutions-history', contentScriptMethod: 'openSolutionsHistory' },
      {
        action: 'navigation:open-power-platform-admin',
        contentScriptMethod: 'openPowerPlatformAdmin',
      },
      { action: 'navigation:pin-to-side-panel', contentScriptMethod: 'pinToSidePanel' },
    ];

    this.registerHandlers(navigationConfigs);
  }

  /**
   * Register all admin-related action handlers
   */
  private static registerAdminHandlers() {
    const adminConfigs: ActionConfig[] = [
      { action: 'admin:get-user-info', contentScriptMethod: 'getUserInfo' },
      {
        action: 'admin:check-user-privilege',
        contentScriptMethod: 'checkUserPrivilege',
        dataExtractor: data => {
          const adminData = data as AdminData;
          return { privilegeName: adminData?.privilegeName };
        },
      },
      {
        action: 'admin:search-users',
        contentScriptMethod: 'searchUsers',
        dataExtractor: data => {
          const adminData = data as AdminData;
          return { query: adminData?.query };
        },
      },
    ];

    this.registerHandlers(adminConfigs);

    console.log(
      '📝 [ActionHandlerRegistry] Impersonation handlers will be registered in background script'
    );
  }

  private static registerDebuggingHandlers() {
    const debuggingConfigs: ActionConfig[] = [
      { action: 'debugging:forms-monitor', contentScriptMethod: 'enableFormsMonitor' },
      { action: 'debugging:ribbon-debugger', contentScriptMethod: 'enableRibbonDebugger' },
      { action: 'debugging:perf-center', contentScriptMethod: 'enablePerfCenter' },
      { action: 'debugging:disable-form-handlers', contentScriptMethod: 'disableFormHandlers' },
      { action: 'debugging:disable-business-rules', contentScriptMethod: 'disableBusinessRules' },
      { action: 'debugging:disable-form-libraries', contentScriptMethod: 'disableFormLibraries' },
      { action: 'debugging:enable-dark-mode', contentScriptMethod: 'enableDarkMode' },
      { action: 'debugging:clear-flags', contentScriptMethod: 'clearFlags' },
    ];

    this.registerHandlers(debuggingConfigs);
  }

  /**
   * Register custom command handlers dynamically
   */
  private static async registerCustomCommandHandlers() {
    // Initialize custom commands service
    await CustomCommandsService.initialize();

    // Register a generic handler for custom commands
    messageService.registerHandler('custom:execute', async (data?: unknown) => {
      const commandData = data as { command?: CustomCommand; commandId?: string };

      let command: CustomCommand;

      if (commandData?.command) {
        // Direct command object passed (used by test execution and MyCommands component)
        command = commandData.command;
      } else if (commandData?.commandId) {
        // Command ID passed (alternative method)
        const foundCommand = await CustomCommandsService.getCommand(commandData.commandId);
        if (!foundCommand) {
          throw new Error(`Custom command not found: ${commandData.commandId}`);
        }
        command = foundCommand;
      } else {
        throw new Error(
          'Either command object or commandId is required for custom command execution'
        );
      }

      return await this.executeContentScript('custom:execute', { command });
    });

    console.log('✅ [ActionHandlerRegistry] Custom command handlers registered');
  }

  /**
   * Execute a script in the content script context
   */
  private static async executeContentScript(
    fullAction: DynamicsAction,
    data?: unknown
  ): Promise<unknown> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'LEVELUP_REQUEST',
        action: fullAction,
        data,
      });

      return result;
    } catch (error) {
      console.error(`❌ [ActionHandlerRegistry] Failed to execute: ${fullAction}`, error);
      throw error;
    }
  }

  public static getRegisteredActions(): DynamicsAction[] {
    return messageService.getRegisteredHandlers();
  }

  public static hasHandler(action: DynamicsAction): boolean {
    return messageService.getRegisteredHandlers().includes(action);
  }
}
