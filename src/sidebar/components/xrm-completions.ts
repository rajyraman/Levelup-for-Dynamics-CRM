/**
 * Comprehensive Xrm API completions for CodeMirror editor
 * Based on @types/xrm definitions
 */

export interface CompletionItem {
  label: string;
  type: 'namespace' | 'object' | 'method' | 'property' | 'interface' | 'enum' | 'function';
  info: string;
  detail: string;
  insertText?: string;
  documentation?: string;
}

export const xrmCompletions: CompletionItem[] = [
  // Xrm.App
  {
    label: 'Xrm.App',
    type: 'object',
    info: 'Provides methods to interact with the current app context.',
    detail: 'Xrm.App',
  },
  {
    label: 'Xrm.App.getCurrentAppProperties()',
    type: 'method',
    info: 'Returns properties of the current app.',
    detail: 'Promise<Xrm.AppProperties>',
    insertText: 'Xrm.App.getCurrentAppProperties()',
  },
  {
    label: 'Xrm.App.getAppUrl()',
    type: 'method',
    info: 'Returns the URL of the current app.',
    detail: 'string',
    insertText: 'Xrm.App.getAppUrl()',
  },

  // Xrm.Panel
  {
    label: 'Xrm.Panel',
    type: 'object',
    info: 'Provides methods to interact with the side panel.',
    detail: 'Xrm.Panel',
  },
  {
    label: 'Xrm.Panel.loadPanel()',
    type: 'method',
    info: 'Loads a custom HTML page in the side panel.',
    detail: 'Promise<void>',
    insertText: 'Xrm.Panel.loadPanel(${1:panelOptions})',
  },
  {
    label: 'Xrm.Panel.closePanel()',
    type: 'method',
    info: 'Closes the currently open side panel.',
    detail: 'Promise<void>',
    insertText: 'Xrm.Panel.closePanel()',
  },

  // Xrm.Navigation modern dialogs
  {
    label: 'Xrm.Navigation.openAlertDialog()',
    type: 'method',
    info: 'Displays an alert dialog.',
    detail: 'Promise<Xrm.Navigation.AlertDialogResponse>',
    insertText: 'Xrm.Navigation.openAlertDialog(${1:alertStrings}, ${2:alertOptions})',
  },
  {
    label: 'Xrm.Navigation.openConfirmDialog()',
    type: 'method',
    info: 'Displays a confirmation dialog.',
    detail: 'Promise<Xrm.Navigation.ConfirmDialogResponse>',
    insertText: 'Xrm.Navigation.openConfirmDialog(${1:confirmStrings}, ${2:confirmOptions})',
  },
  {
    label: 'Xrm.Navigation.openErrorDialog()',
    type: 'method',
    info: 'Displays an error dialog.',
    detail: 'Promise<void>',
    insertText: 'Xrm.Navigation.openErrorDialog(${1:errorOptions})',
  },

  // Xrm.Utility modern methods
  {
    label: 'Xrm.Utility.getEntityMetadata()',
    type: 'method',
    info: 'Returns metadata for an entity.',
    detail: 'Promise<Xrm.Metadata.EntityMetadata>',
    insertText: 'Xrm.Utility.getEntityMetadata("${1:entityLogicalName}")',
  },
  {
    label: 'Xrm.Utility.getResourceString()',
    type: 'method',
    info: 'Returns a localized string for a given resource key.',
    detail: 'string',
    insertText: 'Xrm.Utility.getResourceString("${1:key}")',
  },

  // Xrm.WebApi.online/offline
  {
    label: 'Xrm.WebApi.online',
    type: 'object',
    info: 'Provides methods to use the Web API in online mode.',
    detail: 'Xrm.WebApi.online',
  },
  {
    label: 'Xrm.WebApi.online.createRecord()',
    type: 'method',
    info: 'Creates an entity record (online).',
    detail: 'Promise<Xrm.CreateResponse>',
    insertText: 'Xrm.WebApi.online.createRecord("${1:entityLogicalName}", ${2:data})',
  },
  {
    label: 'Xrm.WebApi.online.deleteRecord()',
    type: 'method',
    info: 'Deletes an entity record (online).',
    detail: 'Promise<Xrm.DeleteResponse>',
    insertText: 'Xrm.WebApi.online.deleteRecord("${1:entityLogicalName}", "${2:id}")',
  },
  {
    label: 'Xrm.WebApi.online.retrieveRecord()',
    type: 'method',
    info: 'Retrieves an entity record (online).',
    detail: 'Promise<any>',

    insertText:
      'Xrm.WebApi.online.retrieveRecord("${1:entityLogicalName}", "${2:id}", "${3:options}")',
  },
  {
    label: 'Xrm.WebApi.online.retrieveMultipleRecords()',
    type: 'method',
    info: 'Retrieves a collection of entity records (online).',
    detail: 'Promise<Xrm.RetrieveMultipleResponse>',

    insertText:
      'Xrm.WebApi.online.retrieveMultipleRecords("${1:entityLogicalName}", "${2:options}")',
  },
  {
    label: 'Xrm.WebApi.online.updateRecord()',
    type: 'method',
    info: 'Updates an entity record (online).',
    detail: 'Promise<Xrm.UpdateResponse>',
    insertText: 'Xrm.WebApi.online.updateRecord("${1:entityLogicalName}", "${2:id}", ${3:data})',
  },
  {
    label: 'Xrm.WebApi.online.execute()',
    type: 'method',
    info: 'Executes a single action, function, or CRUD operation (online).',
    detail: 'Promise<Xrm.ExecuteResponse>',
    insertText: 'Xrm.WebApi.online.execute(${1:request})',
  },
  {
    label: 'Xrm.WebApi.online.executeMultiple()',
    type: 'method',
    info: 'Executes a collection of actions/functions/CRUD operations (online).',
    detail: 'Promise<Xrm.ExecuteMultipleResponse>',
    insertText: 'Xrm.WebApi.online.executeMultiple(${1:requests})',
  },
  {
    label: 'Xrm.WebApi.offline',
    type: 'object',
    info: 'Provides methods to use the Web API in offline mode.',
    detail: 'Xrm.WebApi.offline',
  },
  {
    label: 'Xrm.WebApi.offline.createRecord()',
    type: 'method',
    info: 'Creates an entity record (offline).',
    detail: 'Promise<Xrm.CreateResponse>',
    insertText: 'Xrm.WebApi.offline.createRecord("${1:entityLogicalName}", ${2:data})',
  },
  {
    label: 'Xrm.WebApi.offline.deleteRecord()',
    type: 'method',
    info: 'Deletes an entity record (offline).',
    detail: 'Promise<Xrm.DeleteResponse>',
    insertText: 'Xrm.WebApi.offline.deleteRecord("${1:entityLogicalName}", "${2:id}")',
  },
  {
    label: 'Xrm.WebApi.offline.retrieveRecord()',
    type: 'method',
    info: 'Retrieves an entity record (offline).',
    detail: 'Promise<any>',

    insertText:
      'Xrm.WebApi.offline.retrieveRecord("${1:entityLogicalName}", "${2:id}", "${3:options}")',
  },
  {
    label: 'Xrm.WebApi.offline.retrieveMultipleRecords()',
    type: 'method',
    info: 'Retrieves a collection of entity records (offline).',
    detail: 'Promise<Xrm.RetrieveMultipleResponse>',

    insertText:
      'Xrm.WebApi.offline.retrieveMultipleRecords("${1:entityLogicalName}", "${2:options}")',
  },
  {
    label: 'Xrm.WebApi.offline.updateRecord()',
    type: 'method',
    info: 'Updates an entity record (offline).',
    detail: 'Promise<Xrm.UpdateResponse>',
    insertText: 'Xrm.WebApi.offline.updateRecord("${1:entityLogicalName}", "${2:id}", ${3:data})',
  },
  {
    label: 'Xrm.WebApi.offline.execute()',
    type: 'method',
    info: 'Executes a single action, function, or CRUD operation (offline).',
    detail: 'Promise<Xrm.ExecuteResponse>',
    insertText: 'Xrm.WebApi.offline.execute(${1:request})',
  },
  {
    label: 'Xrm.WebApi.offline.executeMultiple()',
    type: 'method',
    info: 'Executes a collection of actions/functions/CRUD operations (offline).',
    detail: 'Promise<Xrm.ExecuteMultipleResponse>',
    insertText: 'Xrm.WebApi.offline.executeMultiple(${1:requests})',
  },
  // Xrm Root Namespace
  {
    label: 'Xrm',
    type: 'namespace',
    info: 'The Xrm object provides a namespace container for the context, data, and ui objects.',
    detail: 'namespace Xrm',
    documentation: 'Root namespace for all Dynamics 365 Client API functionality.',
  },

  // Xrm.Page (Legacy but still widely used)
  {
    label: 'Xrm.Page',
    type: 'object',
    info: 'Provides methods to retrieve information about the current page (deprecated, use formContext instead)',
    detail: 'Xrm.Page',
    documentation: 'Legacy API - Use executionContext.getFormContext() in ribbon commands instead.',
  },
  {
    label: 'Xrm.Page.data',
    type: 'object',
    info: 'Provides methods to work with form data',
    detail: 'Xrm.Page.data',
  },
  {
    label: 'Xrm.Page.data.entity',
    type: 'object',
    info: 'Provides methods to work with the current entity record',
    detail: 'Xrm.Page.data.entity',
  },
  {
    label: 'Xrm.Page.data.entity.getId()',
    type: 'method',
    info: 'Returns the ID of the current entity record',
    detail: 'string | null',
    insertText: 'Xrm.Page.data.entity.getId()',
  },
  {
    label: 'Xrm.Page.data.entity.getEntityName()',
    type: 'method',
    info: 'Returns the logical name of the current entity',
    detail: 'string',
    insertText: 'Xrm.Page.data.entity.getEntityName()',
  },
  {
    label: 'Xrm.Page.data.entity.save()',
    type: 'method',
    info: 'Saves the current entity record',
    detail: 'Promise<void>',
    insertText: 'Xrm.Page.data.entity.save(${1:saveOptions})',
  },
  {
    label: 'Xrm.Page.getAttribute()',
    type: 'method',
    info: 'Returns the attribute with the specified name',
    detail: 'Xrm.Attributes.Attribute | null',
    insertText: 'Xrm.Page.getAttribute("${1:attributeName}")',
  },
  {
    label: 'Xrm.Page.getControl()',
    type: 'method',
    info: 'Returns the control with the specified name',
    detail: 'Xrm.Controls.Control | null',
    insertText: 'Xrm.Page.getControl("${1:controlName}")',
  },
  {
    label: 'Xrm.Page.ui',
    type: 'object',
    info: 'Provides methods to work with the form UI',
    detail: 'Xrm.Page.ui',
  },
  {
    label: 'Xrm.Page.ui.setFormNotification()',
    type: 'method',
    info: 'Displays a form-level notification',
    detail: 'boolean',
    insertText: 'Xrm.Page.ui.setFormNotification("${1:message}", "${2:level}", "${3:uniqueId}")',
  },
  {
    label: 'Xrm.Page.ui.clearFormNotification()',
    type: 'method',
    info: 'Clears a form-level notification',
    detail: 'boolean',
    insertText: 'Xrm.Page.ui.clearFormNotification("${1:uniqueId}")',
  },
  // Modern formContext methods/properties added to Xrm.Page
  {
    label: 'Xrm.Page.data.entity.save()',
    type: 'method',
    info: 'Saves the current entity record',
    detail: 'Promise<void>',
    insertText: 'Xrm.Page.data.entity.save(${1:saveOptions})',
  },
  {
    label: 'Xrm.Page.getAttribute()',
    type: 'method',
    info: 'Returns the attribute with the specified name',
    detail: 'Xrm.Attributes.Attribute | null',
    insertText: 'Xrm.Page.getAttribute("${1:attributeName}")',
  },
  {
    label: 'Xrm.Page.getControl()',
    type: 'method',
    info: 'Returns the control with the specified name',
    detail: 'Xrm.Controls.Control | null',
    insertText: 'Xrm.Page.getControl("${1:controlName}")',
  },
  {
    label: 'Xrm.Page.ui',
    type: 'object',
    info: 'Provides methods to work with the form UI',
    detail: 'Xrm.Page.ui',
  },
  {
    label: 'Xrm.Page.ui.setFormNotification()',
    type: 'method',
    info: 'Displays a form-level notification',
    detail: 'boolean',
    insertText: 'Xrm.Page.ui.setFormNotification("${1:message}", "${2:level}", "${3:uniqueId}")',
  },
  {
    label: 'Xrm.Page.ui.clearFormNotification()',
    type: 'method',
    info: 'Clears a form-level notification',
    detail: 'boolean',
    insertText: 'Xrm.Page.ui.clearFormNotification("${1:uniqueId}")',
  },
  {
    label: 'Xrm.Page.data.entity.getId()',
    type: 'method',
    info: 'Returns the ID of the current entity record',
    detail: 'string | null',
    insertText: 'Xrm.Page.data.entity.getId()',
  },
  {
    label: 'Xrm.Page.data.entity.getEntityName()',
    type: 'method',
    info: 'Returns the logical name of the current entity',
    detail: 'string',
    insertText: 'Xrm.Page.data.entity.getEntityName()',
  },

  // Xrm.Utility
  {
    label: 'Xrm.Utility',
    type: 'object',
    info: 'Provides utility methods for Dynamics 365',
    detail: 'Xrm.Utility',
  },
  {
    label: 'Xrm.Utility.getGlobalContext()',
    type: 'method',
    info: 'Returns an object that encapsulates all the context information about the current instance',
    detail: 'Xrm.GlobalContext',
    insertText: 'Xrm.Utility.getGlobalContext()',
  },
  {
    label: 'Xrm.Utility.alertDialog()',
    type: 'method',
    info: 'Displays an alert dialog containing a message and an OK button',
    detail: 'Promise<void>',
    insertText: 'Xrm.Utility.alertDialog("${1:message}", ${2:options})',
  },
  {
    label: 'Xrm.Utility.confirmDialog()',
    type: 'method',
    info: 'Displays a confirmation dialog box containing a message and two buttons',
    detail: 'Promise<Xrm.Utility.ConfirmDialogResponse>',
    insertText: 'Xrm.Utility.confirmDialog("${1:message}", ${2:options})',
  },
  {
    label: 'Xrm.Utility.closeProgressIndicator()',
    type: 'method',
    info: 'Closes a progress dialog box currently being displayed',
    detail: 'void',
    insertText: 'Xrm.Utility.closeProgressIndicator()',
  },
  {
    label: 'Xrm.Utility.showProgressIndicator()',
    type: 'method',
    info: 'Displays a progress dialog with the specified message',
    detail: 'void',
    insertText: 'Xrm.Utility.showProgressIndicator("${1:message}")',
  },
  {
    label: 'Xrm.Utility.lookupObjects()',
    type: 'method',
    info: 'Opens a lookup dialog to allow selection of multiple records',
    detail: 'Promise<Xrm.LookupValue[]>',
    insertText: 'Xrm.Utility.lookupObjects(${1:lookupOptions})',
  },

  // Xrm.Navigation
  {
    label: 'Xrm.Navigation',
    type: 'object',
    info: 'Provides navigation-related methods',
    detail: 'Xrm.Navigation',
  },
  {
    label: 'Xrm.Navigation.openForm()',
    type: 'method',
    info: 'Opens an entity form or a quick create form',
    detail: 'Promise<Xrm.Navigation.OpenFormSuccessResponse>',
    insertText: 'Xrm.Navigation.openForm(${1:entityFormOptions}, ${2:formParameters})',
  },
  {
    label: 'Xrm.Navigation.openUrl()',
    type: 'method',
    info: 'Opens a URL, including file URLs',
    detail: 'void',
    insertText: 'Xrm.Navigation.openUrl("${1:url}", ${2:options})',
  },
  {
    label: 'Xrm.Navigation.openDialog()',
    type: 'method',
    info: 'Opens a dialog box',
    detail: 'Promise<Xrm.Navigation.DialogResponse>',
    insertText: 'Xrm.Navigation.openDialog(${1:dialogOptions}, ${2:dialogParameters})',
  },
  {
    label: 'Xrm.Navigation.openErrorDialog()',
    type: 'method',
    info: 'Opens an error dialog with details about the error',
    detail: 'Promise<void>',
    insertText: 'Xrm.Navigation.openErrorDialog(${1:options})',
  },
  {
    label: 'Xrm.Navigation.navigateTo()',
    type: 'method',
    info: 'Navigates to the specified page',
    detail: 'Promise<void>',
    insertText: 'Xrm.Navigation.navigateTo(${1:pageInput}, ${2:navigationOptions})',
  },

  // Xrm.WebApi
  {
    label: 'Xrm.WebApi',
    type: 'object',
    info: 'Provides methods to use Web API to create and manage records and execute Web API actions and functions',
    detail: 'Xrm.WebApi',
  },
  {
    label: 'Xrm.WebApi.createRecord()',
    type: 'method',
    info: 'Creates an entity record',
    detail: 'Promise<Xrm.CreateResponse>',
    insertText: 'Xrm.WebApi.createRecord("${1:entityLogicalName}", ${2:data})',
  },
  {
    label: 'Xrm.WebApi.deleteRecord()',
    type: 'method',
    info: 'Deletes an entity record',
    detail: 'Promise<Xrm.DeleteResponse>',
    insertText: 'Xrm.WebApi.deleteRecord("${1:entityLogicalName}", "${2:id}")',
  },
  {
    label: 'Xrm.WebApi.retrieveRecord()',
    type: 'method',
    info: 'Retrieves an entity record',
    detail: 'Promise<any>',
    insertText: 'Xrm.WebApi.retrieveRecord("${1:entityLogicalName}", "${2:id}", "${3:options}")',
  },
  {
    label: 'Xrm.WebApi.retrieveMultipleRecords()',
    type: 'method',
    info: 'Retrieves a collection of entity records',
    detail: 'Promise<Xrm.RetrieveMultipleResponse>',
    insertText: 'Xrm.WebApi.retrieveMultipleRecords("${1:entityLogicalName}", "${2:options}")',
  },
  {
    label: 'Xrm.WebApi.updateRecord()',
    type: 'method',
    info: 'Updates an entity record',
    detail: 'Promise<Xrm.UpdateResponse>',
    insertText: 'Xrm.WebApi.updateRecord("${1:entityLogicalName}", "${2:id}", ${3:data})',
  },
  {
    label: 'Xrm.WebApi.execute()',
    type: 'method',
    info: 'Executes a single action, function, or CRUD operation against the Web API',
    detail: 'Promise<Xrm.ExecuteResponse>',
    insertText: 'Xrm.WebApi.execute(${1:request})',
  },
  {
    label: 'Xrm.WebApi.executeMultiple()',
    type: 'method',
    info: 'Executes a collection of action, function, or CRUD operations',
    detail: 'Promise<Xrm.ExecuteMultipleResponse>',
    insertText: 'Xrm.WebApi.executeMultiple(${1:requests})',
  },

  // Xrm.Device
  {
    label: 'Xrm.Device',
    type: 'object',
    info: 'Provides methods to access device capabilities',
    detail: 'Xrm.Device',
  },
  {
    label: 'Xrm.Device.captureAudio()',
    type: 'method',
    info: 'Invokes the device microphone to record audio',
    detail: 'Promise<Xrm.Device.CaptureAudioResponse>',
    insertText: 'Xrm.Device.captureAudio()',
  },
  {
    label: 'Xrm.Device.captureImage()',
    type: 'method',
    info: 'Invokes the device camera to capture an image',
    detail: 'Promise<Xrm.Device.CaptureImageResponse>',
    insertText: 'Xrm.Device.captureImage(${1:options})',
  },
  {
    label: 'Xrm.Device.captureVideo()',
    type: 'method',
    info: 'Invokes the device camera to record video',
    detail: 'Promise<Xrm.Device.CaptureVideoResponse>',
    insertText: 'Xrm.Device.captureVideo()',
  },
  {
    label: 'Xrm.Device.getBarcodeValue()',
    type: 'method',
    info: 'Invokes the device camera to scan the barcode information',
    detail: 'Promise<string>',
    insertText: 'Xrm.Device.getBarcodeValue()',
  },
  {
    label: 'Xrm.Device.getCurrentPosition()',
    type: 'method',
    info: 'Returns the current location using the device geolocation capability',
    detail: 'Promise<Xrm.Device.GetCurrentPositionResponse>',
    insertText: 'Xrm.Device.getCurrentPosition()',
  },
  {
    label: 'Xrm.Device.pickFile()',
    type: 'method',
    info: 'Opens a dialog box to select files from your computer',
    detail: 'Promise<Xrm.Device.PickFileResponse[]>',
    insertText: 'Xrm.Device.pickFile(${1:options})',
  },

  // Xrm.Encoding
  {
    label: 'Xrm.Encoding',
    type: 'object',
    info: 'Provides methods to encode and decode strings',
    detail: 'Xrm.Encoding',
  },
  {
    label: 'Xrm.Encoding.xmlAttributeEncode()',
    type: 'method',
    info: 'Encodes the specified string so that it can be used in an XML attribute',
    detail: 'string',
    insertText: 'Xrm.Encoding.xmlAttributeEncode("${1:value}")',
  },
  {
    label: 'Xrm.Encoding.xmlEncode()',
    type: 'method',
    info: 'Encodes the specified string so that it can be used in XML',
    detail: 'string',
    insertText: 'Xrm.Encoding.xmlEncode("${1:value}")',
  },
  {
    label: 'Xrm.Encoding.htmlAttributeEncode()',
    type: 'method',
    info: 'Encodes the specified string so that it can be used in an HTML attribute',
    detail: 'string',
    insertText: 'Xrm.Encoding.htmlAttributeEncode("${1:value}")',
  },
  {
    label: 'Xrm.Encoding.htmlEncode()',
    type: 'method',
    info: 'Encodes the specified string so that it can be used in HTML',
    detail: 'string',
    insertText: 'Xrm.Encoding.htmlEncode("${1:value}")',
  },
  {
    label: 'Xrm.Encoding.htmlDecode()',
    type: 'method',
    info: 'Decodes the specified HTML-encoded string',
    detail: 'string',
    insertText: 'Xrm.Encoding.htmlDecode("${1:value}")',
  },

  // Global Context Properties
  {
    label: 'Xrm.Utility.getGlobalContext().userSettings',
    type: 'object',
    info: 'Returns information about the current user settings',
    detail: 'Xrm.UserSettings',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().userSettings.userId',
    type: 'property',
    info: 'Returns the ID of the current user',
    detail: 'string',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().userSettings.userName',
    type: 'property',
    info: 'Returns the name of the current user',
    detail: 'string',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().userSettings.roles',
    type: 'property',
    info: 'Returns an array of strings that represent the GUID values of each of the security role privilege that the user is associated with',
    detail: 'Xrm.Collection.ItemCollection<Xrm.SecurityRole>',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().organizationSettings',
    type: 'object',
    info: 'Returns information about the current organization settings',
    detail: 'Xrm.OrganizationSettings',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().organizationSettings.organizationId',
    type: 'property',
    info: 'Returns the ID of the current organization',
    detail: 'string',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().organizationSettings.uniqueName',
    type: 'property',
    info: 'Returns the unique name of the current organization',
    detail: 'string',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().client',
    type: 'object',
    info: 'Returns information about the client',
    detail: 'Xrm.Client',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().client.getClient()',
    type: 'method',
    info: 'Returns a value to indicate which client the script is executing in',
    detail: '"Web" | "Outlook" | "Mobile"',
    insertText: 'Xrm.Utility.getGlobalContext().client.getClient()',
  },
  {
    label: 'Xrm.Utility.getGlobalContext().client.getClientState()',
    type: 'method',
    info: 'Returns information about the state of the client',
    detail: '"Online" | "Offline"',
    insertText: 'Xrm.Utility.getGlobalContext().client.getClientState()',
  },

  // Form Context Methods (Modern API)
  {
    label: 'formContext',
    type: 'object',
    info: 'The execution context provides access to the form context (modern API)',
    detail: 'Xrm.FormContext',
  },
  {
    label: 'formContext.data',
    type: 'object',
    info: 'Provides methods to work with form data',
    detail: 'Xrm.FormContext.data',
  },
  {
    label: 'formContext.data.entity',
    type: 'object',
    info: 'Provides methods to work with the current entity record',
    detail: 'Xrm.FormContext.data.entity',
  },
  {
    label: 'formContext.data.entity.getId()',
    type: 'method',
    info: 'Returns the ID of the current entity record',
    detail: 'string | null',
    insertText: 'formContext.data.entity.getId()',
  },
  {
    label: 'formContext.data.entity.getEntityName()',
    type: 'method',
    info: 'Returns the logical name of the current entity',
    detail: 'string',
    insertText: 'formContext.data.entity.getEntityName()',
  },
  {
    label: 'formContext.data.entity.save()',
    type: 'method',
    info: 'Saves the current entity record',
    detail: 'Promise<void>',
    insertText: 'formContext.data.entity.save(${1:saveOptions})',
  },
  {
    label: 'formContext.getAttribute()',
    type: 'method',
    info: 'Returns the attribute with the specified name',
    detail: 'Xrm.Attributes.Attribute | null',
    insertText: 'formContext.getAttribute("${1:attributeName}")',
  },
  {
    label: 'formContext.getControl()',
    type: 'method',
    info: 'Returns the control with the specified name',
    detail: 'Xrm.Controls.Control | null',
    insertText: 'formContext.getControl("${1:controlName}")',
  },
  {
    label: 'formContext.ui',
    type: 'object',
    info: 'Provides methods to work with the form UI',
    detail: 'Xrm.FormContext.ui',
  },
  {
    label: 'formContext.ui.setFormNotification()',
    type: 'method',
    info: 'Displays a form-level notification',
    detail: 'boolean',
    insertText: 'formContext.ui.setFormNotification("${1:message}", "${2:level}", "${3:uniqueId}")',
  },

  // Common JavaScript/Browser APIs
  {
    label: 'console.log()',
    type: 'method',
    info: 'Outputs a message to the web console',
    detail: 'void',
    insertText: 'console.log(${1:message})',
  },
  {
    label: 'console.error()',
    type: 'method',
    info: 'Outputs an error message to the web console',
    detail: 'void',
    insertText: 'console.error(${1:message})',
  },
  {
    label: 'console.warn()',
    type: 'method',
    info: 'Outputs a warning message to the web console',
    detail: 'void',
    insertText: 'console.warn(${1:message})',
  },
  {
    label: 'alert()',
    type: 'function',
    info: 'Displays an alert dialog with the specified message',
    detail: 'void',
    insertText: 'alert("${1:message}")',
  },
  {
    label: 'document.querySelector()',
    type: 'method',
    info: 'Returns the first element that matches the specified CSS selector',
    detail: 'Element | null',
    insertText: 'document.querySelector("${1:selector}")',
  },
  {
    label: 'document.querySelectorAll()',
    type: 'method',
    info: 'Returns all elements that match the specified CSS selector',
    detail: 'NodeList',
    insertText: 'document.querySelectorAll("${1:selector}")',
  },
  {
    label: 'document.getElementById()',
    type: 'method',
    info: 'Returns the element with the specified ID',
    detail: 'Element | null',
    insertText: 'document.getElementById("${1:id}")',
  },
  {
    label: 'setTimeout()',
    type: 'function',
    info: 'Calls a function after a specified number of milliseconds',
    detail: 'number',
    insertText: 'setTimeout(${1:callback}, ${2:delay})',
  },
  {
    label: 'setInterval()',
    type: 'function',
    info: 'Repeatedly calls a function with a fixed time delay between each call',
    detail: 'number',
    insertText: 'setInterval(${1:callback}, ${2:interval})',
  },
  {
    label: 'clearTimeout()',
    type: 'function',
    info: 'Cancels a timeout previously established by calling setTimeout()',
    detail: 'void',
    insertText: 'clearTimeout(${1:timeoutId})',
  },
  {
    label: 'clearInterval()',
    type: 'function',
    info: 'Cancels a timed, repeating action which was previously established by a call to setInterval()',
    detail: 'void',
    insertText: 'clearInterval(${1:intervalId})',
  },

  // Attribute Types and Methods
  {
    label: 'attribute.getValue()',
    type: 'method',
    info: 'Returns the current value of the attribute',
    detail: 'any',
    insertText: 'attribute.getValue()',
  },
  {
    label: 'attribute.setValue()',
    type: 'method',
    info: 'Sets the value of the attribute',
    detail: 'void',
    insertText: 'attribute.setValue(${1:value})',
  },
  {
    label: 'attribute.getName()',
    type: 'method',
    info: 'Returns the logical name of the attribute',
    detail: 'string',
    insertText: 'attribute.getName()',
  },
  {
    label: 'attribute.getRequiredLevel()',
    type: 'method',
    info: 'Returns the required level for the attribute',
    detail: '"none" | "required" | "recommended"',
    insertText: 'attribute.getRequiredLevel()',
  },
  {
    label: 'attribute.setRequiredLevel()',
    type: 'method',
    info: 'Sets the required level for the attribute',
    detail: 'void',
    insertText: 'attribute.setRequiredLevel("${1:requirementLevel}")',
  },

  // Control Methods
  {
    label: 'control.getVisible()',
    type: 'method',
    info: 'Returns whether the control is visible',
    detail: 'boolean',
    insertText: 'control.getVisible()',
  },
  {
    label: 'control.setVisible()',
    type: 'method',
    info: 'Sets whether the control is visible',
    detail: 'void',
    insertText: 'control.setVisible(${1:visible})',
  },
  {
    label: 'control.getDisabled()',
    type: 'method',
    info: 'Returns whether the control is disabled',
    detail: 'boolean',
    insertText: 'control.getDisabled()',
  },
  {
    label: 'control.setDisabled()',
    type: 'method',
    info: 'Sets whether the control is disabled',
    detail: 'void',
    insertText: 'control.setDisabled(${1:disabled})',
  },
  {
    label: 'control.getName()',
    type: 'method',
    info: 'Returns the name of the control',
    detail: 'string',
    insertText: 'control.getName()',
  },
  {
    label: 'control.getLabel()',
    type: 'method',
    info: 'Returns the label for the control',
    detail: 'string',
    insertText: 'control.getLabel()',
  },
  {
    label: 'control.setLabel()',
    type: 'method',
    info: 'Sets the label for the control',
    detail: 'void',
    insertText: 'control.setLabel("${1:label}")',
  },
];

/**
 * Filter completions based on the current word being typed
 */
export function filterCompletions(word: string, maxResults = 50): CompletionItem[] {
  if (!word) {
    // Return most common completions when no word is typed
    return xrmCompletions.slice(0, 20);
  }

  const filtered = xrmCompletions.filter(completion => {
    const label = completion.label.toLowerCase();
    const wordLower = word.toLowerCase();

    // Exact match or starts with
    if (label === wordLower || label.startsWith(wordLower)) {
      return true;
    }

    // Contains the word
    if (label.includes(wordLower)) {
      return true;
    }

    // Fuzzy matching for dot notation (e.g., typing "xrm.util" should match "Xrm.Utility")
    if (label.includes('.') && wordLower.includes('.')) {
      const labelParts = label.split('.');
      const wordParts = wordLower.split('.');

      if (wordParts.length <= labelParts.length) {
        return wordParts.every(
          (part, index) => labelParts[index] && labelParts[index].toLowerCase().startsWith(part)
        );
      }
    }

    return false;
  });

  // Sort by relevance: exact match first, then starts with, then contains
  filtered.sort((a, b) => {
    const aLabel = a.label.toLowerCase();
    const bLabel = b.label.toLowerCase();
    const wordLower = word.toLowerCase();

    // Exact match
    if (aLabel === wordLower) {
      return -1;
    }
    if (bLabel === wordLower) {
      return 1;
    }

    // Starts with
    const aStarts = aLabel.startsWith(wordLower);
    const bStarts = bLabel.startsWith(wordLower);
    if (aStarts && !bStarts) {
      return -1;
    }
    if (bStarts && !aStarts) {
      return 1;
    }

    // Length (shorter is better for starts with)
    if (aStarts && bStarts) {
      return aLabel.length - bLabel.length;
    }

    // Alphabetical for others
    return aLabel.localeCompare(bLabel);
  });

  return filtered.slice(0, maxResults);
}

/**
 * Get completions for a specific context (e.g., after "Xrm.")
 */
export function getContextualCompletions(context: string): CompletionItem[] {
  const contextLower = context.toLowerCase().trim();

  if (!contextLower) {
    return xrmCompletions
      .filter(
        c =>
          c.label.startsWith('Xrm') ||
          c.label.startsWith('formContext') ||
          c.label.startsWith('console') ||
          c.label.startsWith('document')
      )
      .slice(0, 20);
  }

  // Filter based on context
  return xrmCompletions.filter(completion => {
    const label = completion.label.toLowerCase();

    // If context ends with '.', show members of that object
    if (contextLower.endsWith('.')) {
      const prefix = contextLower.slice(0, -1);
      return label.startsWith(prefix + '.') && !label.substring(prefix.length + 1).includes('.');
    }

    // Show completions that start with the context
    return label.startsWith(contextLower);
  });
}
