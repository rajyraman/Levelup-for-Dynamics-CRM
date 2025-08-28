// Form actions module for Dynamics 365 forms

/// <reference types="xrm" />

import { DynamicsUtils } from './utils';
import { WebApiClient } from './webapi-client';
import { ConfettiEffects } from './confetti-effects';
import { OptionSetData, OptionSetControl, OptionSetOption } from '#types/global';

interface Solution {
  uniquename: string;
  friendlyname: string;
  solutionid: string;
  version: string;
  ismanaged: boolean;
}

interface ExtensionInstance {
  getPreferredSolution(): Promise<Solution | null>;
  getDefaultSolution(): Promise<Solution | null>;
}

interface WorkflowProcess {
  mode_Formatted: string;
  statecode_Formatted: string;
  statuscode_Formatted: string;
  workflowid: string;
  name: string;
  description?: string;
  category: number;
  type?: number;
  mode?: number;
  scope?: number;
  statecode: number;
  statuscode?: number;
  createdon?: string;
  modifiedon?: string;
  _ownerid_value?: string;
  _ownerid_value_Formatted: string;
}

interface CustomApiProcess {
  customapiid: string;
  uniquename: string;
  displayname?: string;
  description?: string;
  bindingtype: number;
  createdon?: string;
  modifiedon?: string;
  _ownerid_value?: string;
  _ownerid_value_Formatted?: string;
}

export class FormActions {
  private extension: ExtensionInstance;

  constructor(extension: ExtensionInstance) {
    this.extension = extension;
  }

  /**
   * Get user's preferred solution information or fall back to Default solution
   */
  private async getPreferredSolution(): Promise<{
    solutionId: string;
    solutionFriendlyName: string;
    usedDefaultSolution: boolean;
    notificationMessage?: string;
  }> {
    // Try to get the preferred solution using the centralized method
    const preferredSolution = await this.extension.getPreferredSolution();
    try {
      if (
        preferredSolution &&
        preferredSolution.friendlyname !== 'Common Data Services Default Solution'
      ) {
        return {
          solutionId: preferredSolution.solutionid,
          solutionFriendlyName: preferredSolution.friendlyname,
          usedDefaultSolution: false,
        };
      } else {
        throw new Error('No custom preferred solution found');
      }
    } catch (error) {
      // Fall back to Default solution using the centralized method
      try {
        const defaultSolution = await this.extension.getDefaultSolution();

        if (defaultSolution) {
          return {
            solutionId: defaultSolution.solutionid,
            solutionFriendlyName: defaultSolution.friendlyname,
            usedDefaultSolution: true,
            notificationMessage: `No custom preferred solution found. Using ${preferredSolution?.friendlyname ?? defaultSolution.friendlyname}. You can set your preferred solution in Power Platform Maker Portal.`,
          };
        }
      } catch (defaultError) {
        // Ultimate fallback with hardcoded Default solution ID
        // Both preferred and default solution lookup failed, using hardcoded Default solution ID
      }

      // Ultimate fallback with hardcoded Default solution ID
      return {
        solutionId: 'fd140aaf-4df4-11dd-bd17-0019b9312238',
        solutionFriendlyName: 'Default Solution',
        usedDefaultSolution: true,
        notificationMessage:
          'No custom preferred solution found. Using Default solution. You can set your preferred solution in Power Platform Maker Portal.',
      };
    }
  }

  /**
   * Show logical names for fields, tabs, and sections
   */
  showLogicalNames(): string {
    // Display logical names for fields, tabs, and sections
    // First, clear any existing logical names to prevent duplicates
    this.clearLogicalNames();

    const attributes = Xrm.Page.data.entity.attributes.get();
    let processedCount = 0;

    attributes.forEach((attr: Xrm.Attributes.Attribute) => {
      try {
        const logicalName = attr.getName();
        // Use default click handler that shows visual feedback
        DynamicsUtils.addClickHandlerToLogicalName(logicalName);
        processedCount++;
      } catch (_error) {
        // Skip fields that cause errors (e.g., virtual fields, calculated fields)
      }
    });

    return `Logical names displayed as clickable links (${processedCount} fields processed) - click any logical name to copy it to clipboard`;
  }

  /**
   * Clear logical names and restore original labels
   */
  clearLogicalNames(): string {
    document.querySelectorAll('.levelup-logical-name').forEach(x => x.remove());
    return 'Logical names cleared and original labels restored';
  }

  /**
   * Enable "God Mode" - make all fields visible and editable
   */
  enableGodMode(): string {
    let unlockCount = 0;

    // Create the confetti burst effect first
    ConfettiEffects.createConfettiBurst();

    // Make all mandatory fields optional
    const attributes = Xrm.Page.data.entity.attributes.get();
    attributes.forEach((attr: Xrm.Attributes.Attribute) => {
      if (attr.getRequiredLevel() === 'required') {
        attr.setRequiredLevel('none');
        unlockCount++;
      }
    });

    // Make all controls visible and enabled
    Xrm.Page.ui.controls.forEach((control: Xrm.Controls.Control) => {
      // Cast to StandardControl to access setVisible and setDisabled
      const standardControl = control as Xrm.Controls.StandardControl;
      const wasHidden = standardControl.getVisible && !standardControl.getVisible();
      const wasDisabled = standardControl.getDisabled && standardControl.getDisabled();

      if (standardControl.setVisible) {
        standardControl.setVisible(true);
      }
      if (standardControl.setDisabled) {
        standardControl.setDisabled(false);
      }

      if (wasHidden || wasDisabled) {
        unlockCount++;
      }
    });

    // Make all tabs and sections visible
    Xrm.Page.ui.tabs.forEach((tab: Xrm.Controls.Tab) => {
      const wasTabHidden = !tab.getVisible();
      tab.setVisible(true);

      if (wasTabHidden) {
        unlockCount++;
      }

      tab.sections.forEach((section: Xrm.Controls.Section) => {
        const wasSectionHidden = !section.getVisible();
        section.setVisible(true);

        if (wasSectionHidden) {
          unlockCount++;
        }
      });
    });

    return `${unlockCount} elements unlocked`;
  }

  /**
   * Highlight changed fields on the form
   */
  highlightChangedFields(): string {
    // Remove existing highlights
    DynamicsUtils.removeStyles('levelup-changed-fields');

    const changedFields: string[] = [];

    try {
      // Get the data XML which contains only changed fields
      const dataXml = Xrm.Page.data.entity.getDataXml();

      if (dataXml) {
        // Parse the XML to extract field names
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(dataXml, 'text/xml');

        // Get the root element (entity name)
        const rootElement = xmlDoc.documentElement;

        if (rootElement) {
          // Get all child elements (these are the changed fields)
          const fieldElements = rootElement.children;

          for (let i = 0; i < fieldElements.length; i++) {
            const fieldName = fieldElements[i].tagName;
            changedFields.push(fieldName);
          }
        }
      }
    } catch (_error) {
      // If XML parsing fails, fall back to the attribute-level change detection
      DynamicsUtils.showToast('Unable to parse data XML, falling back to attribute checks', 'info');
      // Fallback to the old method if XML parsing fails
      const attributes = Xrm.Page.data.entity.attributes.get();
      attributes.forEach((attr: Xrm.Attributes.Attribute) => {
        if (attr.getIsDirty && attr.getIsDirty()) {
          changedFields.push(attr.getName());
        }
      });
    }

    if (changedFields.length > 0) {
      // Create individual styles for each field to avoid selector conflicts
      const styles = changedFields
        .map(field => {
          return `
                #${field}_c, [data-id="${field}"] {
                    position: relative !important;
                    border-left: 4px solid #742774 !important;
                    background: linear-gradient(90deg, rgba(116, 39, 116, 0.05) 0%, transparent 100%) !important;
                    box-shadow: 0 0 0 1px rgba(116, 39, 116, 0.2) !important;
                    border-radius: 4px !important;
                    transition: all 0.2s ease !important;
                }

                #${field}_c:hover, [data-id="${field}"]:hover {
                    box-shadow: 0 0 0 1px rgba(116, 39, 116, 0.4) !important;
                    background: linear-gradient(90deg, rgba(116, 39, 116, 0.08) 0%, transparent 100%) !important;
                }

                #${field}_c::before, [data-id="${field}"]::before {
                    content: '●' !important;
                    position: absolute !important;
                    top: 8px !important;
                    right: 8px !important;
                    color: #742774 !important;
                    font-size: 8px !important;
                    opacity: 0.7 !important;
                    pointer-events: none !important;
                    z-index: 1000 !important;
                }`;
        })
        .join('\n');

      DynamicsUtils.addStyles('levelup-changed-fields', styles);
    }

    return `${changedFields.length} changed fields highlighted`;
  }

  /**
   * Get current record URL
   */
  getRecordUrl(): string {
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId().replace(/[{}]/g, '');
    const orgUrl = DynamicsUtils.getOrganizationUrl();

    const recordUrl = `${orgUrl}/main.aspx?etn=${entityName}&id=${recordId}&pagetype=entityrecord`;

    // Show in a text dialog with copy functionality
    DynamicsUtils.showTextDialog('Record URL', recordUrl);
    return recordUrl;
  }

  /**
   * Get current record ID
   */
  getRecordId(): string {
    const recordId = Xrm.Page.data.entity.getId().replace(/[{}]/g, '');
    DynamicsUtils.showTextDialog('Record ID', recordId);
    return recordId;
  }

  /**
   * Open current record in Web API
   */
  openWebApiRecord(): string {
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId().replace(/[{}]/g, '');
    const orgUrl = DynamicsUtils.getOrganizationUrl();

    const webApiUrl = `${orgUrl}/api/data/v9.0/${DynamicsUtils.getEntityCollectionName(entityName)}(${recordId})`;
    Xrm.Navigation.openUrl(webApiUrl);

    return 'Web API record opened in new tab';
  }

  /**
   * Refresh all subgrids on the form
   */
  refreshAllSubgrids(): string {
    let refreshedCount = 0;
    Xrm.Page.ui.controls.forEach((control: Xrm.Controls.Control) => {
      if (control.getControlType && control.getControlType() === 'subgrid') {
        const subgridControl = control as Xrm.Controls.GridControl;
        if (subgridControl.refresh) {
          subgridControl.refresh();
          refreshedCount++;
        }
      }
    });

    return `${refreshedCount} subgrids refreshed`;
  }

  /**
   * Show option set values in a popup table with enhanced performance for large datasets
   */
  showOptionSetValues(): string {
    // Get all optionset controls and their options
    const optionsetData: OptionSetData[] = Xrm.Page.getControl()
      .filter((x: Xrm.Controls.Control) => x.getControlType() === 'optionset')
      .map((x: Xrm.Controls.Control) => {
        const optionsetControl = x as OptionSetControl;
        return {
          name: optionsetControl.getName(),
          options: optionsetControl.getOptions(),
        };
      });

    if (optionsetData.length === 0) {
      return 'No option set controls found on this form';
    }

    // Create separate tables for each optionset
    const tables = optionsetData.map(control => {
      const rows = control.options
        ? control.options.map((option: OptionSetOption) => [
            option.text || 'N/A',
            option.value === null ||
            option.value === undefined ||
            Number.isNaN(option.value) ||
            String(option.value) === 'NaN'
              ? '-'
              : String(option.value),
          ])
        : [];

      return {
        title: `${control.name}`,
        description: `${rows.length} option(s) available`,
        headers: ['OptionSet Name', 'OptionSet Value'],
        rows: rows,
      };
    });

    // Use dual-pane layout for multiple optionsets (> 1)
    const layoutMode = optionsetData.length > 1 ? 'dual-pane' : 'standard';

    // Show popup with dual-pane layout for better navigation
    DynamicsUtils.createMuiPopup({
      id: 'levelup-optionset-popup',
      title: `OptionSet Values (${optionsetData.length} controls)`,
      tables: tables,
      layoutMode: layoutMode,
      showOpenInNewTab: true,
    });

    return `Found ${optionsetData.length} option set control(s)`;
  }

  /**
   * Clone current record
   */
  async cloneRecord(): Promise<string> {
    const entityName = Xrm.Page.data.entity.getEntityName();

    // Get all field values to pass as parameters
    const parameters: Record<string, string> = {};
    const attributes = Xrm.Page.data.entity.attributes
      .get()
      .filter(
        a =>
          a.getName() !== 'createdon' &&
          a.getName() !== 'modifiedon' &&
          a.getName() !== 'createdby' &&
          a.getName() !== 'modifiedby' &&
          a.getName() !== 'ownerid'
      );

    attributes.forEach((attr: Xrm.Attributes.Attribute) => {
      const value = attr.getValue();
      if (value) {
        parameters[attr.getName()] = String(value);
      }
    });
    await Xrm.Navigation.openForm({ entityName: entityName, openInNewWindow: true }, parameters);

    return 'Record cloned in new window';
  }

  /**
   * Refresh form without saving and disable auto-save
   */
  async refreshWithoutSave(): Promise<string> {
    // Remove any existing changed field highlights
    DynamicsUtils.removeStyles('levelup-changed-fields');

    await Xrm.Page.data.refresh(false);
    Xrm.Page.data.entity.addOnSave((econtext: Xrm.Events.SaveEventContext) => {
      const eventArgs = econtext.getEventArgs();
      if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
        eventArgs.preventDefault();
      }
    });
    Xrm.Navigation.openAlertDialog({
      title: 'Information',
      text: 'Form refreshed without save. Autosave turned off.',
    });
    return 'Form refreshed with auto-save disabled';
  }

  /**
   * Show all field logical names with their current values in a popup table
   */
  async showAllFields(): Promise<string> {
    try {
      const entityLogicalName = Xrm.Page.data.entity.getEntityName();
      const recordId = Xrm.Page.data.entity.getId().replace(/[{}]/g, '');
      const collection = DynamicsUtils.getEntityCollectionName(entityLogicalName);
      const webApiClient = WebApiClient.getInstance();

      // Retrieve full record with annotations to get formatted values
      const record = await webApiClient.retrieveRecord(collection, recordId);

      const rows: string[][] = [];
      const processedFields = new Set<string>();

      // Simply iterate through all record properties
      Object.keys(record).forEach(key => {
        try {
          // Skip annotation keys and already processed fields
          if (key.includes('@') || processedFields.has(key)) {
            return;
          }

          const value = (record as unknown as Record<string, unknown>)[key];
          let displayValue = '';

          if (value === null || value === undefined) {
            displayValue = '[NULL]';
          } else if (value === '') {
            displayValue = '[EMPTY STRING]';
          } else if (value instanceof Date) {
            // Handle Date objects
            displayValue = value.toISOString();
          } else if (typeof value === 'object') {
            // Handle other objects but avoid double quotes for simple values
            if (Array.isArray(value)) {
              displayValue = value.length === 0 ? '[empty array]' : value.join(', ');
            } else {
              // For objects, check if it's a simple value wrapped in quotes
              const stringified = JSON.stringify(value);
              // If it's a quoted string, remove the outer quotes
              if (
                stringified.startsWith('"') &&
                stringified.endsWith('"') &&
                stringified.length > 2
              ) {
                displayValue = stringified.slice(1, -1); // Remove outer quotes
              } else {
                displayValue = stringified;
              }
            }
          } else if (typeof value === 'string') {
            // If it's already a string, don't add extra quotes
            displayValue = value;
          } else {
            displayValue = String(value);
          }

          // Add all fields regardless of value
          rows.push([key, displayValue]);
        } catch (e) {
          rows.push([key, '[Error reading value]']);
        }
      });

      rows.sort((a, b) => a[0].localeCompare(b[0]));

      DynamicsUtils.createMuiPopup({
        id: 'levelup-all-fields-popup',
        title: `All Fields (${rows.length})`,
        tables: [
          {
            title: 'Field Values (Web API)',
            headers: ['Field Name', 'Field Value'],
            description: `${rows.length} field(s) returned via Web API for ${entityLogicalName}`,
            rows,
          },
        ],
        layoutMode: 'standard',
        enableSearch: true,
        showOpenInNewTab: true,
      });

      return `Displayed ${rows.length} field(s) from Web API`;
    } catch (error) {
      DynamicsUtils.showToast('Error retrieving fields via Web API', 'error');
      return 'Failed to retrieve fields via Web API';
    }
  }

  /**
   * Open the Power Platform form editor for the current record
   */
  async openFormEditor(): Promise<string> {
    try {
      const entityName = Xrm.Page.data.entity.getEntityName();
      const environmentId = Xrm.Utility.getGlobalContext().organizationSettings.bapEnvironmentId;

      // Get solution information using the reusable method
      const solutionInfo = await this.getPreferredSolution();

      if (solutionInfo.usedDefaultSolution && solutionInfo.notificationMessage) {
        DynamicsUtils.showToast(solutionInfo.notificationMessage, 'info');
      }

      const formId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
      const formEditorUrl = `https://make.powerapps.com/e/${environmentId}/s/${solutionInfo.solutionId}/entity/${entityName}/form/edit/${formId}`;

      // Open the form editor in a new tab
      Xrm.Navigation.openUrl(formEditorUrl);

      // Return success message
      let successMessage = `Form editor opened for ${entityName} in solution: ${solutionInfo.solutionFriendlyName}`;
      if (solutionInfo.usedDefaultSolution && solutionInfo.notificationMessage) {
        successMessage += ` (${solutionInfo.notificationMessage})`;
      }

      return successMessage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      DynamicsUtils.showToast(`Failed to open form editor: ${errorMessage}`, 'error');
      throw new Error(`Failed to open form editor: ${errorMessage}`);
    }
  }

  /**
   * Show table processes (workflows, business rules, BPFs, custom APIs, actions) in a dual-pane dialog
   */
  async showTableProcesses(): Promise<string> {
    try {
      const webApiClient = WebApiClient.getInstance();
      const entityName = Xrm.Page.data.entity.getEntityName();
      const environmentId = Xrm.Utility.getGlobalContext().organizationSettings.bapEnvironmentId;

      // Get solution information using the reusable method
      const solutionInfo = await this.getPreferredSolution();

      // Fetch all workflows for this entity in one call
      const workflowsResponse = await webApiClient.retrieveMultiple('workflows', {
        filter: `primaryentity eq '${entityName}' and statecode eq 1`,
        select: [
          'workflowid',
          'name',
          'description',
          'category',
          'type',
          'mode',
          'scope',
          'statecode',
          'statuscode',
          'createdon',
          'modifiedon',
          '_ownerid_value',
        ],
        orderBy: ['name asc'],
      });

      // Fetch custom APIs separately since they're in a different entity
      const customApisResponse = await webApiClient.retrieveMultiple('customapis', {
        filter: `bindingtype eq 1 and boundentitylogicalname eq '${entityName}'`,
        select: [
          'customapiid',
          'uniquename',
          'displayname',
          'description',
          'bindingtype',
          'createdon',
          'modifiedon',
          '_ownerid_value',
        ],
        orderBy: ['uniquename asc'],
      });

      const allWorkflows = workflowsResponse.value || [];
      const allCustomApis = customApisResponse.value || [];

      // Define process type configurations with their respective URL patterns
      const processTypes = [
        {
          title: 'Realtime Workflows',
          filter: (w: WorkflowProcess) => w.category === 0 && w.type === 1 && w.mode === 1,
          urlType: 'classicworkflow', // Uses classic Dynamics URL
        },
        {
          title: 'Background Workflows',
          filter: (w: WorkflowProcess) => w.category === 0 && w.type === 1 && w.mode === 0,
          urlType: 'classicworkflow', // Uses classic Dynamics URLv
        },
        {
          title: 'Flows',
          filter: (w: WorkflowProcess) => w.category === 5 && w.type === 1,
          urlType: 'flow', // Modern flows use Power Automate portal
        },
        {
          title: 'Business Rules',
          filter: (w: WorkflowProcess) => w.category === 2,
          urlType: 'businessrule',
        },
        {
          title: 'Business Process Flows',
          filter: (w: WorkflowProcess) => w.category === 4,
          urlType: 'classicworkflow', // Uses classic Dynamics URL
        },
        {
          title: 'Actions',
          filter: (w: WorkflowProcess) => w.category === 3,
          urlType: 'classicworkflow', // Uses classic Dynamics URL
        },
      ];

      const tables = [];
      let totalProcesses = 0;

      // Create tables for workflow-based processes
      processTypes.forEach(processType => {
        const processes = allWorkflows.filter(processType.filter);
        totalProcesses += processes.length;

        const rows = processes.map((process: WorkflowProcess) => {
          const name = process.name || 'N/A';
          const description = process.description || 'No description';

          // Generate the correct URL based on process type
          let makerUrl: string;
          const orgUrl = DynamicsUtils.getOrganizationUrl();

          if (processType.urlType === 'flow') {
            // Modern flows and BPFs use Power Automate portal
            makerUrl = `https://make.powerautomate.com/environments/${environmentId}/solutions/${solutionInfo.solutionId}/flows/${process.workflowid}/details?utm_source=levelup_extension`;
          } else if (processType.urlType === 'businessrule') {
            // Business rules use classic Dynamics URL
            makerUrl = `${orgUrl}/tools/systemcustomization/businessrules/businessRulesDesigner.aspx?BRlaunchpoint=BRGrid&appSolutionId=%7B${solutionInfo.solutionId}%7D&id=%7B${process.workflowid}%7D`;
          } else {
            // Workflows and Actions use classic Dynamics URL
            makerUrl = `${orgUrl}/sfa/workflow/edit.aspx?appSolutionId=%7b${solutionInfo.solutionId}%7d&id=%7b${process.workflowid}%7d`;
          }

          const nameWithLink = `<a href="${makerUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">${name}</a>`;

          // Format status based on process type
          let status = '';
          if (
            processType.title === 'Realtime Workflows' ||
            processType.title === 'Background Workflows'
          ) {
            const baseStatus = process.statecode_Formatted;
            const modeText = process.mode_Formatted;
            status = `${baseStatus} (${modeText})`;
          } else if (processType.title === 'Business Rules') {
            const baseStatus = process.statecode_Formatted;
            const scopeMap: { [key: number]: string } = {
              1: 'Entity',
              2: 'All Forms',
              3: 'Specific Form',
            };
            const scopeText = scopeMap[process.scope || 0] || 'Unknown';
            status = `${baseStatus} (${scopeText})`;
          } else {
            status = process.statuscode_Formatted;
          }

          const owner = process._ownerid_value_Formatted || 'N/A';

          return [nameWithLink, description, status, owner];
        });

        tables.push({
          title: processType.title,
          description: `${processes.length} ${processType.title.toLowerCase()} found`,
          headers: ['Name', 'Description', 'Status', 'Owner'],
          rows,
          allowHtmlInColumns: [0], // Allow HTML in the Name column
        });
      });

      // Add Custom APIs table
      totalProcesses += allCustomApis.length;
      const customApiRows = await Promise.all(
        allCustomApis.map(async (api: CustomApiProcess) => {
          const name = api.uniquename || api.displayname || 'N/A';
          const description = api.description || 'No description';

          // Custom APIs use classic Dynamics URL pattern
          const orgUrl = DynamicsUtils.getOrganizationUrl();
          const appProperties = await Xrm.Utility.getGlobalContext().getCurrentAppProperties();
          const makerUrl = `${orgUrl}/main.aspx?appid=${appProperties.appId}&forceUCI=1&newWindow=true&pagetype=entityrecord&etn=customapi&id=${api.customapiid}`;
          const nameWithLink = `<a href="${makerUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">${name}</a>`;

          const status = `Active (${api.bindingtype === 1 ? 'Entity' : 'Global'})`;
          const owner = api._ownerid_value_Formatted || 'N/A';

          return [nameWithLink, description, status, owner];
        })
      );

      tables.push({
        title: 'Custom APIs',
        description: `${allCustomApis.length} custom apis found`,
        headers: ['Name', 'Description', 'Status', 'Owner'],
        rows: customApiRows,
        allowHtmlInColumns: [0], // Allow HTML in the Name column
      });

      // Use dual-pane layout for better navigation
      DynamicsUtils.createMuiPopup({
        id: 'levelup-table-processes-popup',
        title: `Table Processes for ${entityName} (${totalProcesses} total)`,
        tables,
        layoutMode: 'dual-pane',
        showOpenInNewTab: true,
        enableSearch: true,
      });

      return `Found ${totalProcesses} processes across ${tables.length} categories for ${entityName}. Click any process name to open in Power Apps maker portal (${solutionInfo.solutionFriendlyName}).`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      DynamicsUtils.showToast(`Failed to load table processes: ${errorMessage}`, 'error');
      throw new Error(`Failed to load table processes: ${errorMessage}`);
    }
  }
}
