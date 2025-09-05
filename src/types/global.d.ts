// Global type definitions for the extension

/// <reference types="xrm" />
/// <reference types="chrome" />

import { CustomCommandAction } from './custom-commands';

// Extension display modes
export type ExtensionDisplayMode = 'default' | 'simple';

// Extend Window interface for content script loading flag
declare global {
  interface Window {
    __levelUpContentScriptLoaded?: boolean;
  }
}

// Define grouped action types
export type FormActionName =
    | 'show-logical-names'
    | 'clear-logical-names'
    | 'god-mode'
    | 'changed-fields'
    | 'record-url'
    | 'record-id'
    | 'open-web-api'
    | 'refresh-subgrids'
    | 'show-optionset-values'
    | 'clone-record'
    | 'refresh-autosave-off'
    | 'all-fields'
    | 'forms-monitor'
    | 'ribbon-debugger'
    | 'open-editor'
    | 'table-processes'

export type NavigationActionName =
    | 'open-record-by-id'
    | 'new-record'
    | 'open-list'
    | 'open-security'
    | 'open-system-jobs'
    | 'open-solutions'
    | 'open-processes'
    | 'open-mailboxes'
    | 'open-main'
    | 'open-advanced-find'
    | 'open-mobile-client'
    | 'open-power-platform-admin'
    | 'open-solutions-history'
    | 'pin-to-side-panel';

export type AdminActionName =
    | 'get-user-info'
    | 'check-user-privilege'
    | 'get-organization-settings'
    | 'get-client-info'
    | 'check-system-health'
    | 'generate-diagnostic-report'
    | 'search-users'
    | 'start-impersonation'
    | 'stop-impersonation'
    | 'get-impersonation-status'
    | 'force-cleanup-impersonation';

export type DebuggingActionName =
    | 'forms-monitor'
    | 'ribbon-debugger'
    | 'perf-center'
    | 'disable-form-handlers'
    | 'disable-business-rules'
    | 'disable-form-libraries'
    | 'enable-dark-mode'
    | 'clear-flags';

// Grouped action types
export type FormAction = `form:${FormActionName}`;
export type NavigationAction = `navigation:${NavigationActionName}`;
export type AdminAction = `admin:${AdminActionName}`;
export type DebuggingAction = `debugging:${DebuggingActionName}`;

// Discriminated union of all possible actions
export type DynamicsAction =
    | FormAction
    | NavigationAction
    | AdminAction
    | DebuggingAction
    | CustomCommandAction;

export interface ActionMessage {
    type: 'LEVELUP_REQUEST';
    action: DynamicsAction;
    data?: unknown;
    requestId?: string;
}

export interface DynamicsContext {
    isForm: boolean;
    isView: boolean;
    entityName?: string;
    recordId?: string;
    formType?: number;
}

export interface DynamicsResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface EnvironmentInfo {
    organizationGeo?: string;
    organizationId: string;
    uniqueName: string;
    version: string;
    clientUrl: string;
    currentUserId: string;
    currentUserName: string;
    organizationLanguageId: number;
    isOnPremise: boolean;
    webResourceUrl: string;
}

export interface ImpersonationUser {
    systemuserid: string;
    azureactivedirectoryobjectid: string;
    fullname: string;
    internalemailaddress: string;
    domainname: string;
}

export interface SearchResult {
    users: ImpersonationUser[];
    hasMoreResults: boolean;
    totalResultsMessage?: string;
}

export interface TabSection {
    getName(): string;
    getLabel(): string;
    setLabel(label: string): void;
}

export interface TabControl {
    getName(): string;
    getLabel(): string;
    setLabel(label: string): void;
    sections: Xrm.Controls.Section[];
}

// Option Set types
export interface OptionSetOption {
    text: string;
    value: number | null;
}

export interface OptionSetControl extends Xrm.Controls.StandardControl {
    getName(): string;
    getOptions(): OptionSetOption[];
    getControlType(): string;
}

export interface OptionSetData {
    name: string;
    options: OptionSetOption[];
}

// Entity metadata types
export interface EntityMetadata {
    LogicalName: string;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    LogicalCollectionName?: string;
    ObjectTypeCode?: number;
    IconSmallName?: string | null;
    IconMediumName?: string | null;
    IconLargeName?: string | null;
    [key: string]: unknown;
}

export interface EntityMetadataCache {
    entities: EntityMetadata[];
    timestamp: number;
}

// WebAPI types
export type WebApiRecord = Record<string, unknown>;
export type WebApiParameters = Record<string, unknown>;

export interface WebApiResponse {
    [key: string]: unknown;
}

// Chrome API type extensions
export interface ChromeTab {
    id?: number;
    url?: string;
    active?: boolean;
    windowId?: number;
    status?: string;
}

export interface ChromeTabChangeInfo {
    status?: string;
    url?: string;
    pinned?: boolean;
    audible?: boolean;
    mutedInfo?: chrome.tabs.MutedInfo;
    favIconUrl?: string;
    title?: string;
}

export interface ChromeActiveInfo {
    tabId: number;
    windowId: number;
}

export interface ChromeWebNavigationDetails {
    tabId: number;
    url: string;
    frameId: number;
    timeStamp: number;
}

export interface ChromeRuntimeSender {
    tab?: chrome.tabs.Tab;
    frameId?: number;
    id?: string;
    url?: string;
    tlsChannelId?: string;
}
export interface NavigationData {
    entityName?: string;
    recordId?: string;
}

export interface AdminData {
    privilegeName?: string;
    query?: string;
}

// Extend Window interface for custom properties
declare global {
    interface Window {
        levelUpOriginalLabels?: Map<string, string>;
    }

    namespace Xrm {
        interface OrganizationSettings {
            /**
             * Returns the Business Application Platform (BAP) environment ID for the current organization.
             * This is used for integration with Power Platform Admin Center.
             */
            bapEnvironmentId: string;
        }
    }

    interface XrmStatic {
        Internal: {
            isUci(): boolean;
        };
    }
}
