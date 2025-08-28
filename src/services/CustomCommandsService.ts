// Custom Commands Service - Manages CRUD operations for custom JavaScript commands

import {
  CustomCommand,
  CustomCommandValidation,
  CustomCommandImportExport,
} from '#types/custom-commands';

const STORAGE_KEY = 'levelup-custom-commands';
const MAX_LINES = 500;

export class CustomCommandsService {
  private static commands: Map<string, CustomCommand> = new Map();
  private static initialized = false;

  /**
   * Initialize the service and load commands from storage
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.loadCommands();
    this.initialized = true;
  }

  /**
   * Load commands from localStorage
   */
  private static async loadCommands(): Promise<void> {
    console.log('[CustomCommandsService] loadCommands called');
    try {
      // Try chrome.storage.local first (more persistent)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        console.log('[CustomCommandsService] Trying to load from chrome.storage.local...');
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        if (result[STORAGE_KEY]) {
          console.log('[CustomCommandsService] Found data in chrome.storage.local');
          const commands = JSON.parse(result[STORAGE_KEY]) as CustomCommand[];
          this.commands.clear();
          commands.forEach(cmd => this.commands.set(cmd.id, cmd));
          console.log(
            '[CustomCommandsService] Loaded',
            commands.length,
            'commands from chrome.storage.local'
          );
          return;
        } else {
          console.log('[CustomCommandsService] No data found in chrome.storage.local');
        }
      } else {
        console.log('[CustomCommandsService] chrome.storage.local not available');
      }

      // Fallback to localStorage (if available)
      if (typeof localStorage !== 'undefined') {
        console.log('[CustomCommandsService] Trying to load from localStorage...');
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          console.log('[CustomCommandsService] Found data in localStorage');
          const commands = JSON.parse(saved) as CustomCommand[];
          this.commands.clear();
          commands.forEach(cmd => this.commands.set(cmd.id, cmd));
          console.log(
            '[CustomCommandsService] Loaded',
            commands.length,
            'commands from localStorage'
          );
        } else {
          console.log('[CustomCommandsService] No data found in localStorage');
        }
      } else {
        console.log('[CustomCommandsService] localStorage not available');
      }
    } catch (error) {
      console.error('[CustomCommandsService] Error loading custom commands:', error);
      this.commands.clear();
    }
  }

  /**
   * Save commands to storage
   */
  private static async saveCommands(): Promise<void> {
    console.log('[CustomCommandsService] saveCommands called');
    try {
      const commandsArray = Array.from(this.commands.values());
      const serialized = JSON.stringify(commandsArray);
      console.log('[CustomCommandsService] Serialized commands:', serialized.length, 'characters');

      // Save to chrome.storage.local if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        console.log('[CustomCommandsService] Saving to chrome.storage.local...');
        await chrome.storage.local.set({ [STORAGE_KEY]: serialized });
        console.log('[CustomCommandsService] Saved to chrome.storage.local successfully');
      } else {
        console.log('[CustomCommandsService] chrome.storage.local not available');
      }

      // Also save to localStorage as fallback (if available)
      if (typeof localStorage !== 'undefined') {
        console.log('[CustomCommandsService] Saving to localStorage...');
        localStorage.setItem(STORAGE_KEY, serialized);
        console.log('[CustomCommandsService] Saved to localStorage successfully');
      } else {
        console.log('[CustomCommandsService] localStorage not available');
      }
    } catch (error) {
      console.error('[CustomCommandsService] Error saving custom commands:', error);
      throw new Error('Failed to save custom commands');
    }
  }

  /**
   * Get all custom commands
   */
  static async getAllCommands(): Promise<CustomCommand[]> {
    await this.initialize();
    return Array.from(this.commands.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get a specific command by ID
   */
  static async getCommand(id: string): Promise<CustomCommand | undefined> {
    await this.initialize();
    return this.commands.get(id);
  }

  /**
   * Create a new custom command
   */
  static async createCommand(
    command: Omit<CustomCommand, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomCommand> {
    console.log('[CustomCommandsService] createCommand called with:', command);
    await this.initialize();

    const validation = this.validateCommand(command.code);
    console.log('[CustomCommandsService] Validation result:', validation);
    if (!validation.isValid) {
      const error = `Command validation failed: ${validation.errors.join(', ')}`;
      console.error('[CustomCommandsService] Validation failed:', error);
      throw new Error(error);
    }

    const now = Date.now();
    const newCommand: CustomCommand = {
      ...command,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    console.log('[CustomCommandsService] Generated new command:', newCommand);
    this.commands.set(newCommand.id, newCommand);
    console.log('[CustomCommandsService] Command added to memory, saving...');

    try {
      await this.saveCommands();
      console.log('[CustomCommandsService] Command saved successfully');
    } catch (saveError) {
      console.error('[CustomCommandsService] Save failed:', saveError);
      // Remove from memory if save failed
      this.commands.delete(newCommand.id);
      throw saveError;
    }

    return newCommand;
  }

  /**
   * Update an existing command
   */
  static async updateCommand(
    id: string,
    updates: Partial<Omit<CustomCommand, 'id' | 'createdAt'>>
  ): Promise<CustomCommand> {
    await this.initialize();

    const existingCommand = this.commands.get(id);
    if (!existingCommand) {
      throw new Error(`Command with ID ${id} not found`);
    }

    // Validate code if it's being updated
    if (updates.code) {
      const validation = this.validateCommand(updates.code);
      if (!validation.isValid) {
        throw new Error(`Command validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const updatedCommand: CustomCommand = {
      ...existingCommand,
      ...updates,
      updatedAt: Date.now(),
    };

    this.commands.set(id, updatedCommand);
    await this.saveCommands();

    return updatedCommand;
  }

  /**
   * Delete a command
   */
  static async deleteCommand(id: string): Promise<boolean> {
    await this.initialize();

    const exists = this.commands.has(id);
    if (exists) {
      this.commands.delete(id);
      await this.saveCommands();
    }

    return exists;
  }

  /**
   * Validate JavaScript code
   */
  static validateCommand(code: string): CustomCommandValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check line count
    const lines = code.split('\n');
    const lineCount = lines.length;

    if (lineCount > MAX_LINES) {
      errors.push(`Code exceeds maximum of ${MAX_LINES} lines (current: ${lineCount})`);
    }

    // Check for empty code
    if (!code.trim()) {
      errors.push('Code cannot be empty');
    }

    // Basic syntax validation without using eval/Function constructor
    // Check for basic syntax patterns that would indicate invalid JavaScript
    const codeText = code.trim();

    // Check for mismatched braces, parentheses, brackets
    const braceCount = (codeText.match(/\{/g) || []).length - (codeText.match(/\}/g) || []).length;
    const parenCount = (codeText.match(/\(/g) || []).length - (codeText.match(/\)/g) || []).length;
    const bracketCount =
      (codeText.match(/\[/g) || []).length - (codeText.match(/\]/g) || []).length;

    if (braceCount !== 0) {
      errors.push(
        `Mismatched braces: ${braceCount > 0 ? 'missing closing brace(s)' : 'extra closing brace(s)'}`
      );
    }
    if (parenCount !== 0) {
      errors.push(
        `Mismatched parentheses: ${parenCount > 0 ? 'missing closing parenthesis' : 'extra closing parenthesis'}`
      );
    }
    if (bracketCount !== 0) {
      errors.push(
        `Mismatched brackets: ${bracketCount > 0 ? 'missing closing bracket(s)' : 'extra closing bracket(s)'}`
      );
    }

    // Check for unterminated strings (basic check without regex lookbehind)
    let singleQuoteCount = 0;
    let doubleQuoteCount = 0;
    let backtickCount = 0;
    let escaped = false;

    for (let i = 0; i < codeText.length; i++) {
      const char = codeText[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === "'") {
        singleQuoteCount++;
      }
      if (char === '"') {
        doubleQuoteCount++;
      }
      if (char === '`') {
        backtickCount++;
      }
    }

    if (singleQuoteCount % 2 !== 0) {
      errors.push('Unterminated string: missing closing single quote');
    }
    if (doubleQuoteCount % 2 !== 0) {
      errors.push('Unterminated string: missing closing double quote');
    }
    if (backtickCount % 2 !== 0) {
      errors.push('Unterminated template literal: missing closing backtick');
    }

    // Check for potentially dangerous patterns (warnings only for simple execution)
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=.*<script/i,
      /outerHTML\s*=.*<script/i,
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        warnings.push(`Potentially unsafe pattern detected: ${pattern.source}`);
      }
    });

    // Check for async patterns without proper handling
    if (code.includes('await') && !code.includes('async')) {
      warnings.push('Using await without async function declaration');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lineCount,
    };
  }

  /**
   * Export commands to JSON
   */
  static async exportCommands(): Promise<string> {
    await this.initialize();

    const exportData: CustomCommandImportExport = {
      version: '1.0.0',
      exportedAt: Date.now(),
      commands: Array.from(this.commands.values()),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import commands from JSON
   */
  static async importCommands(
    jsonData: string,
    overwrite: boolean = false
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await this.initialize();

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      const importData = JSON.parse(jsonData) as CustomCommandImportExport;

      if (!importData.commands || !Array.isArray(importData.commands)) {
        throw new Error('Invalid import format: missing commands array');
      }

      for (const command of importData.commands) {
        try {
          // Validate command structure
          if (!command.name || !command.code) {
            errors.push(`Skipping command: missing name or code`);
            skipped++;
            continue;
          }

          // Validate code
          const validation = this.validateCommand(command.code);
          if (!validation.isValid) {
            errors.push(`Skipping command "${command.name}": ${validation.errors.join(', ')}`);
            skipped++;
            continue;
          }

          // Check if command already exists
          const existingCommand = Array.from(this.commands.values()).find(
            cmd => cmd.name === command.name
          );
          if (existingCommand && !overwrite) {
            errors.push(`Skipping command "${command.name}": already exists`);
            skipped++;
            continue;
          }

          // Import the command
          const now = Date.now();
          const importedCommand: CustomCommand = {
            ...command,
            id: existingCommand?.id || this.generateId(),
            createdAt: existingCommand?.createdAt || now,
            updatedAt: now,
          };

          this.commands.set(importedCommand.id, importedCommand);
          imported++;
        } catch (error) {
          errors.push(`Error importing command: ${(error as Error).message}`);
          skipped++;
        }
      }

      if (imported > 0) {
        await this.saveCommands();
      }
    } catch (error) {
      errors.push(`Failed to parse import data: ${(error as Error).message}`);
    }

    return { imported, skipped, errors };
  }

  /**
   * Generate a unique ID for commands
   */
  private static generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get command statistics
   */
  static async getStats(): Promise<{
    totalCommands: number;
    totalLines: number;
    avgLines: number;
  }> {
    await this.initialize();

    const commands = Array.from(this.commands.values());
    const totalCommands = commands.length;
    const totalLines = commands.reduce((sum, cmd) => sum + cmd.code.split('\n').length, 0);
    const avgLines = totalCommands > 0 ? Math.round(totalLines / totalCommands) : 0;

    return { totalCommands, totalLines, avgLines };
  }
}
