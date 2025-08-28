// Custom commands types and interfaces

export interface CustomCommand {
  id: string;
  name: string;
  description?: string;
  code: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CustomCommandExecution {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export type CustomCommandAction = `custom:${string}`;

export interface CustomCommandValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lineCount: number;
}

export interface CustomCommandImportExport {
  version: string;
  exportedAt: number;
  commands: CustomCommand[];
}
