// Custom Commands Execution Module
// Handles execution of user-defined JavaScript commands in the Dynamics 365 page context

/// <reference types="xrm" />

import { CustomCommand, CustomCommandExecution } from '#types/custom-commands';

export class CustomCommandsExecutor {
  private static readonly EXECUTION_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RESULT_SIZE = 10000; // Max characters in result

  /**
   * Execute a custom JavaScript command in the page context
   */
  static async executeCommand(command: CustomCommand): Promise<CustomCommandExecution> {
    const startTime = Date.now();

    try {
      console.log(`[Level Up] Executing custom command: ${command.name}`);

      // Basic validation
      if (!command || !command.code || !command.code.trim()) {
        throw new Error('Command code is empty or invalid');
      }

      // Execute the command directly in page context
      // Since we only need execution without complex response handling
      const executeScript = new Function(command.code);
      executeScript();

      const executionTime = Date.now() - startTime;

      console.log(
        `[Level Up] Command "${command.name}" executed successfully in ${executionTime}ms`
      );

      return {
        success: true,
        result: 'Command executed successfully',
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';

      console.error(`[Level Up] Command "${command.name}" failed:`, error);

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Validate command before execution
   */
  private static validateCommand(command: CustomCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if command exists and has code
    if (!command || !command.code) {
      errors.push('Command or code is missing');
    }

    // Check line count
    if (command.code) {
      const lineCount = command.code.split('\n').length;
      if (lineCount > 50) {
        errors.push(`Command exceeds maximum of 50 lines (has ${lineCount} lines)`);
      }
    }

    // Basic syntax validation
    try {
      new Function(command.code);
    } catch (syntaxError) {
      errors.push(`Syntax error: ${(syntaxError as Error).message}`);
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /document\.write/,
      /location\s*=/,
      /window\.open/,
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(command.code)) {
        errors.push(`Potentially unsafe pattern detected: ${pattern.source}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create execution context with safe access to Xrm and utilities
   */
  private static createExecutionContext() {
    return {
      // Xrm API access
      Xrm: typeof Xrm !== 'undefined' ? Xrm : undefined,

      // Safe console methods
      console: {
        log: (...args: any[]) => console.log('[Custom Command]', ...args),
        error: (...args: any[]) => console.error('[Custom Command]', ...args),
        warn: (...args: any[]) => console.warn('[Custom Command]', ...args),
        info: (...args: any[]) => console.info('[Custom Command]', ...args),
      },

      // Helper functions
      returnResult: (result: any) => {
        return result;
      },

      returnError: (error: string) => {
        throw new Error(error);
      },

      // Date utilities
      Date: Date,

      // JSON utilities
      JSON: JSON,

      // Math utilities
      Math: Math,

      // String utilities
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,

      // Promise for async operations
      Promise: Promise,
    };
  }

  /**
   * Execute code with timeout protection
   */
  private static async executeWithTimeout(
    code: string,
    context: any,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        // Create function with provided context
        const asyncFunction = new Function(
          ...Object.keys(context),
          `
          try {
            // User code starts here
            ${code}
            // User code ends here
          } catch (error) {
            throw new Error('Runtime error: ' + error.message);
          }
          `
        );

        // Execute the function
        const result = asyncFunction.apply(null, Object.values(context));

        // Handle both sync and async results
        if (result && typeof result.then === 'function') {
          // Async result
          result
            .then((asyncResult: any) => {
              clearTimeout(timeoutId);
              resolve(asyncResult);
            })
            .catch((error: Error) => {
              clearTimeout(timeoutId);
              reject(error);
            });
        } else {
          // Sync result
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Sanitize execution result for safe transport
   */
  private static sanitizeResult(result: any): any {
    try {
      // Convert result to string for size checking
      const stringified = JSON.stringify(result, this.jsonReplacer);

      // Check size limit
      if (stringified.length > this.MAX_RESULT_SIZE) {
        return {
          _truncated: true,
          _originalSize: stringified.length,
          _maxSize: this.MAX_RESULT_SIZE,
          _preview: stringified.substring(0, this.MAX_RESULT_SIZE - 100) + '...',
        };
      }

      return result;
    } catch (error) {
      // If JSON.stringify fails, return a safe representation
      return {
        _error: 'Result could not be serialized',
        _type: typeof result,
        _toString: String(result).substring(0, 1000),
      };
    }
  }

  /**
   * JSON replacer function to handle special objects
   */
  private static jsonReplacer(key: string, value: any): any {
    // Handle functions
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    // Handle undefined
    if (value === undefined) {
      return '[undefined]';
    }

    // Handle circular references and DOM elements
    if (value && typeof value === 'object') {
      // Check for DOM elements
      if (value.nodeType) {
        return `[DOM Element: ${value.tagName || value.nodeName}]`;
      }

      // Check for common Xrm objects
      if (value.constructor && value.constructor.name) {
        const constructorName = value.constructor.name;
        if (constructorName.includes('Xrm') || constructorName.includes('Control')) {
          return `[Xrm Object: ${constructorName}]`;
        }
      }
    }

    return value;
  }

  /**
   * Get command execution capabilities (what APIs are available)
   */
  static getExecutionCapabilities(): {
    hasXrm: boolean;
    hasPage: boolean;
    hasWebApi: boolean;
    hasUtility: boolean;
    hasNavigation: boolean;
    pageType?: string;
    entityName?: string;
  } {
    const capabilities = {
      hasXrm: typeof Xrm !== 'undefined',
      hasPage: false,
      hasWebApi: false,
      hasUtility: false,
      hasNavigation: false,
      pageType: undefined as string | undefined,
      entityName: undefined as string | undefined,
    };

    if (capabilities.hasXrm) {
      try {
        capabilities.hasPage = !!Xrm.Page;
        capabilities.hasWebApi = !!Xrm.WebApi;
        capabilities.hasUtility = !!Xrm.Utility;
        capabilities.hasNavigation = !!Xrm.Navigation;

        const pageContext = Xrm.Utility?.getPageContext();
        if (pageContext) {
          try {
            // Try to access page input (may not be available in all contexts)
            if (pageContext.input) {
              capabilities.pageType = pageContext.input.pageType;
              capabilities.entityName = pageContext.input.entityName;
            }
          } catch (contextError) {
            // Ignore context access errors
          }
        }
      } catch (error) {
        console.warn('[Level Up] Error checking Xrm capabilities:', error);
      }
    }

    return capabilities;
  }

  /**
   * Test command syntax without executing
   */
  static validateSyntax(code: string): { isValid: boolean; error?: string } {
    try {
      new Function(code);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown syntax error',
      };
    }
  }
}
