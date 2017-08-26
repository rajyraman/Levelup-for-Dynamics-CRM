module LevelUp {
    export module Types {
        export type MessageType =
            "Page" |
            "VisibilityCheck" |
            "displayLogicalNames" |
            "godMode" |
            "formProperties" |
            "highlightDirtyFields" |
            "copyRecordUrl" |
            "copyRecordId" |
            "refreshAllSubgrids" |
            "populateMin" |
            "optionSetValues" |
            "cloneRecord" |
            "refresh" |
            "toggleTabs" |
            "workflows" |
            "copyLookup" |
            "pasteLookup" |
            "openLookupNewWindow" |
            "customize" |
            "allFields" |
            "openRecord" |
            "newRecord" |
            "openSecurity" |
            "openSystemJobs" |
            "openSolutions" |
            "openProcesses" |
            "openMain" |
            "openAdvFind" |
            "mocaClient" |
            "myUserRecord" |
            "myMailbox" |
            "diagnostics" |
            "perfCenter" |
            "instancePicker" |
            "openGrid" |
            "quickFindFields" |
            "environmentDetails" |
            "myRoles" |
            "allUserRoles" |
            "processes" |
            "Settings" |
            "Extension" |
            "Load";

        export type Category = 
            "Settings" |
            "Extension" |        
            "Forms" |
            "Navigation" |
            "Grid" |
            "API" |
            "Load" |
            "Extension" |
            "myRoles" |  
            "allFields" |                      
            "quickFindFields" |
            "workflows" |
            "allUserRoles"        

        export enum ExtensionState {
            "On",
            "Off"
        }

        export interface ExtensionMessage {
            type: MessageType,
            category?: Category,
            content?: ResultRow[] | ResultRowKeyValues[][] | string
        }

        export interface CustomMessage extends Event {
            detail: ExtensionMessage
        }

        export enum AreaType {
            "Form",
            "Grid",
            "General"
        }

        export interface ResultRow {
            cells: string[]
        }

        export interface ResultRowKeyValues {
            key: string,
            value: string
        }
    }
}