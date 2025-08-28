// UI Framework for Level Up extension - Modern lightweight approach

import { TableDialog } from './table-dialog';

export interface ComponentConfig {
  id?: string;
  className?: string;
  style?: Record<string, string>;
  onClick?: () => void;
  onClose?: () => void;
}

export interface DialogConfig extends ComponentConfig {
  title: string;
  content: string;
  copyable?: boolean;
  autoClose?: number;
}

export interface PopupConfig extends ComponentConfig {
  title: string;
  tables: Array<{
    title: string;
    headers: string[];
    rows: string[][];
    description?: string;
  }>;
  maxWidth?: string;
  maxHeight?: string;
}

export interface TableConfig {
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
  striped?: boolean;
  hover?: boolean;
}

export class UIFramework {
  private static componentRegistry = new Map<string, HTMLElement>();

  /**
   * Create and show a popup component with tables using the new TableDialog system
   */
  static createPopup(config: PopupConfig): void {
    // Remove existing popup if it exists
    if (config.id) {
      this.removeComponent(config.id);
    }

    // Use the new TableDialog system
    TableDialog.show({
      id: config.id,
      title: config.title,
      tables: config.tables,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      onClose: config.onClose,
    });
  }

  /**
   * Show popup - alias for createPopup for backward compatibility
   */
  static show(component: HTMLElement | PopupConfig): void {
    if (component instanceof HTMLElement) {
      document.body.appendChild(component);
    } else {
      this.createPopup(component);
    }
  }

  /**
   * Create a simple dialog with copy functionality
   */
  static createDialog(config: DialogConfig): void {
    // Create a simple text dialog using TableDialog
    TableDialog.show({
      title: config.title,
      tables: [
        {
          title: 'Content',
          headers: ['Information'],
          rows: [[config.content]],
        },
      ],
      maxWidth: '600px',
      onClose: config.onClose,
    });
  }

  /**
   * Remove a component from the DOM and registry
   */
  static removeComponent(id: string): void {
    const component = this.componentRegistry.get(id);
    if (component && component.parentNode) {
      component.remove();
    }
    this.componentRegistry.delete(id);

    // Also try to close TableDialog if it has the same ID
    TableDialog.close(id);
  }

  /**
   * Get a registered component
   */
  static getComponent(id: string): HTMLElement | undefined {
    return this.componentRegistry.get(id);
  }

  /**
   * Clean up all registered components
   */
  static cleanup(): void {
    this.componentRegistry.forEach(component => {
      if (component.parentNode) {
        component.remove();
      }
    });
    this.componentRegistry.clear();

    // Close all TableDialogs
    TableDialog.close();
  }
}
