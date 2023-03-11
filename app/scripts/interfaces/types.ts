export type MessageType =
  | 'Page'
  | 'displayLogicalNames'
  | 'godMode'
  | 'formProperties'
  | 'highlightDirtyFields'
  | 'copyRecordUrl'
  | 'copyRecordId'
  | 'refreshAllSubgrids'
  | 'populateMin'
  | 'optionSetValues'
  | 'cloneRecord'
  | 'refresh'
  | 'toggleTabs'
  | 'workflows'
  | 'copyLookup'
  | 'pasteLookup'
  | 'openLookupNewWindow'
  | 'customize'
  | 'allFields'
  | 'openRecord'
  | 'newRecord'
  | 'openSecurity'
  | 'openSystemJobs'
  | 'openSolutions'
  | 'openProcesses'
  | 'openMain'
  | 'openAdvFind'
  | 'mocaClient'
  | 'myUserRecord'
  | 'myMailbox'
  | 'diagnostics'
  | 'perfCenter'
  | 'instancePicker'
  | 'openGrid'
  | 'quickFindFields'
  | 'environmentDetails'
  | 'myRoles'
  | 'allUserRoles'
  | 'processes'
  | 'loadUsers'
  | 'activation'
  | 'reset'
  | 'search'
  | 'impersonation';

export type Category =
  | 'Impersonation'
  | 'Settings'
  | 'Forms'
  | 'Navigation'
  | 'Grid'
  | 'API'
  | 'Load'
  | 'Extension'
  | 'myRoles'
  | 'allFields'
  | 'entityMetadata'
  | 'quickFindFields'
  | 'workflows'
  | 'allUserRoles'
  | 'optionsets'
  | 'environment'
  | 'userDetail'
  | 'changeUser';

export type ExtensionState = 'On' | 'Off';
export type ExtensionMessageContent =
  | IResultRow[]
  | IResultRowKeyValues[][]
  | IImpersonateMessage
  | IImpersonationResponse
  | UserDetail[]
  | string;
export interface IImpersonationResponse {
  users: UserDetail[];
  impersonateRequest: IImpersonateMessage;
}
export interface IExtensionMessage {
  type: MessageType;
  category?: Category;
  content?: ExtensionMessageContent;
}

export interface ICustomMessage extends Event {
  detail: IExtensionMessage;
}

export enum AreaType {
  'Form',
  'Grid',
  'General',
}

export interface IResultRow {
  cells: string[];
}

export interface IResultRowKeyValues {
  key: string;
  value: string;
}

export interface IImpersonateMessage {
  userName: string;
  isActive?: boolean;
  url?: string;
}

export interface IRetrieveCurrentOrganizationResponse {
  Detail: IRetrieveCurrentOrganizationResponseDetail;
}
export interface IRetrieveCurrentOrganizationResponseDetail {
  EnvironmentId: string;
  FriendlyName: string;
  Geo: string;
  OrganizationId: string;
  OrganizationVersion: string;
  State: string;
  TenantId: string;
  UniqueName: string;
  UrlName: string;
}

declare global {
  interface Window {
    Xrm: Xrm.XrmStatic;
  }
}

export enum LocalStorage {
  lastUrl = 'lastUrl',
  currentUrl = 'currentUrl',
  users = 'usersList',
  isImpersonating = 'isImpersonating',
  userId = 'userId',
  userName = 'userName',
}

export interface IExtensionLocalStorage {
  lastUrl: string;
  currentUrl: string;
  users: any[];
  isImpersonating: boolean;
  userId: string;
  userName: string;
}

export interface UserDetail {
  userId: string;
  userName: string;
  fullName: string;
}
export interface ImpersonationStorage {
  isImpersonationActive: boolean;
  userName: string;
  userFullName: string;
}
