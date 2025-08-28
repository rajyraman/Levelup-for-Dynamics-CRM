// Unified messaging system for Level Up extension
// This replaces the scattered message types with a clean, type-safe system

export type MessageType =
  | 'DYNAMICS_ACTION'
  | 'SESSION_MANAGEMENT'
  | 'METADATA_REQUEST'
  | 'USER_SEARCH';

export interface BaseMessage {
  type: MessageType;
  requestId: string;
}

export interface DynamicsActionMessage extends BaseMessage {
  type: 'DYNAMICS_ACTION';
  action: string;
  data?: unknown;
}

export interface SessionMessage extends BaseMessage {
  type: 'SESSION_MANAGEMENT';
  operation: 'SET' | 'GET' | 'CLEAR';
  sessionKey?: string;
}

export interface MetadataMessage extends BaseMessage {
  type: 'METADATA_REQUEST';
  entityType: 'all' | 'specific';
  entityName?: string;
}

export interface UserSearchMessage extends BaseMessage {
  type: 'USER_SEARCH';
  query: string;
}

export type IncomingMessage =
  | DynamicsActionMessage
  | SessionMessage
  | MetadataMessage
  | UserSearchMessage;

export interface MessageResponse {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// Message routing configuration
export interface MessageRoute {
  type: MessageType;
  handler: string; // method name on the handler class
  requiresInjectedScript: boolean;
}

export const MESSAGE_ROUTES: MessageRoute[] = [
  {
    type: 'DYNAMICS_ACTION',
    handler: 'handleDynamicsAction',
    requiresInjectedScript: true,
  },
  {
    type: 'SESSION_MANAGEMENT',
    handler: 'handleSessionManagement',
    requiresInjectedScript: false,
  },
  {
    type: 'METADATA_REQUEST',
    handler: 'handleMetadataRequest',
    requiresInjectedScript: true,
  },
  {
    type: 'USER_SEARCH',
    handler: 'handleUserSearch',
    requiresInjectedScript: true,
  },
];
