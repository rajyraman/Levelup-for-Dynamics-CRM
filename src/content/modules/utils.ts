// Utility functions for Dynamics 365 interactions

/// <reference types="xrm" />

import { TableDialog } from './table-dialog';
import { EntityMetadataCache } from '#types/global';

export interface NavigationConfig {
  url?: string;
  entityName?: string;
  pageType?: string;
  area?: string;
  parameters?: Record<string, string>;
}

export class DynamicsUtils {
  /**
   * Check if current context is a form page
   */
  static isFormContext(): boolean {
    // Method 1: Try standard Xrm.Page detection in main window
    if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {
      return true;
    }

    // Method 2: Try modern Xrm.Utility approach in main window
    try {
      if (typeof Xrm !== 'undefined' && Xrm.Utility?.getPageContext) {
        const pageContext = Xrm.Utility.getPageContext();
        return pageContext.input?.pageType === 'entityrecord';
      }
    } catch (error) {
      // Xrm not ready yet
    }

    // Method 3: Check for Xrm in first iframe (Classic mode)
    try {
      const firstFrame = window.frames[0] as Window & { Xrm?: typeof Xrm };
      if (
        firstFrame &&
        firstFrame.Xrm &&
        firstFrame.Xrm.Page &&
        firstFrame.Xrm.Page.data &&
        firstFrame.Xrm.Page.data.entity
      ) {
        return true;
      }
    } catch (error) {
      // Cannot access iframe content (cross-origin or not loaded yet)
    }

    return false;
  }

  /**
   * Convert logical entity name to Web API entity set name
   */
  static getEntityCollectionName(entityName: string): string {
    // First try to get from cached metadata
    const entityCollectionName =
      DynamicsUtils.getEntityCollectionNameFromCache(entityName) ?? `${entityName}s`;
    return entityCollectionName;
  }

  /**
   * Get entity set name from cached metadata
   */
  private static getEntityCollectionNameFromCache(entityName: string): string | null {
    try {
      // Try to get from different possible cache keys (environment-specific)
      const cacheKeys = [
        `levelup_entity_metadata_${window.location.hostname.toLowerCase()}`,
        'levelup_entity_metadata_cache',
      ];

      for (const cacheKey of cacheKeys) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as EntityMetadataCache;
          if (parsed?.entities) {
            const entity = parsed.entities.find(
              e => e.LogicalName?.toLowerCase() === entityName.toLowerCase()
            );
            if (entity?.LogicalCollectionName) {
              return entity.LogicalCollectionName;
            }
          }
        }
      }
    } catch (error) {
      DynamicsUtils._log(`Failed to get entity set name from cache: ${String(error)}`, 'error');
    }
    return null;
  }

  /**
   * Escape HTML characters to prevent XSS
   */
  private static htmlEscape(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show a modal dialog with content using the new TableDialog system
   */
  static showDialog(title: string, content: string, copyable: boolean = false): void {
    TableDialog.show({
      title,
      tables: [
        {
          title: copyable ? 'Content (Click to copy)' : 'Content',
          headers: ['Information'],
          rows: [[content]],
        },
      ],
    });
  }

  /**
   * Show a simple text dialog with copy functionality
   */
  static showTextDialog(title: string, content: string): void {
    // Create a simple text input dialog with copy button
    const dialogId = `levelup-text-dialog-${Date.now()}`;

    const dialogHTML = `
      <div class="levelup-dialog-backdrop" id="${dialogId}-backdrop" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
      ">
        <div class="levelup-text-dialog" style="
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90vw;
          font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          animation: slideIn 0.3s ease-out;
        ">
          <div class="levelup-dialog-header" style="
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 10px;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px 8px 0 0;
          ">
            <span>${this.htmlEscape(title)}</span>
            <button class="levelup-dialog-close" style="
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.9);
              font-size: 24px;
              cursor: pointer;
              padding: 4px 8px;
              border-radius: 4px;
              transition: all 0.2s ease;
              line-height: 1;
            " aria-label="Close dialog">×</button>
          </div>
          <div class="levelup-dialog-content" style="
            padding: 24px;
          ">
            <div style="
              display: flex;
              gap: 8px;
              align-items: stretch;
            ">
              <input type="text" readonly value="${this.htmlEscape(content)}" class="levelup-text-input" style="
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                color: #374151;
                background: #f9fafb;
                cursor: pointer;
                transition: all 0.2s ease;
              " />
              <button class="levelup-copy-btn" style="
                padding: 12px 16px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                min-width: 80px;
                height: 40px;
              ">Copy</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const dialogElement = document.createElement('div');
    dialogElement.innerHTML = dialogHTML;
    document.body.appendChild(dialogElement.firstElementChild!);

    const backdrop = document.getElementById(`${dialogId}-backdrop`);
    const closeButton = backdrop?.querySelector('.levelup-dialog-close') as HTMLButtonElement;
    const textInput = backdrop?.querySelector('.levelup-text-input') as HTMLInputElement;
    const copyButton = backdrop?.querySelector('.levelup-copy-btn') as HTMLButtonElement;

    const closeDialog = () => {
      backdrop?.remove();
    };

    // Auto-select text when clicked
    textInput?.addEventListener('click', () => {
      textInput.select();
    });

    // Copy functionality
    copyButton?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(content);
        copyButton.textContent = 'Copied!';
        copyButton.style.background = '#10b981';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.style.background = '#2563eb';
        }, 2000);
      } catch (error) {
        // Fallback for older browsers
        textInput?.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        copyButton.style.background = '#10b981';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.style.background = '#2563eb';
        }, 2000);
      }
    });

    // Close handlers
    backdrop?.addEventListener('click', e => {
      if (e.target === backdrop) {
        closeDialog();
      }
    });

    closeButton?.addEventListener('click', closeDialog);

    // Close on Escape key
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Focus the input
    textInput?.focus();
    textInput?.select();
  }

  /**
   * Get organization URL from global context
   */
  static getOrganizationUrl(): string {
    return Xrm.Utility.getGlobalContext().getClientUrl();
  }

  /**
   * Wait for an element to be available in the DOM
   */
  static waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement | null> {
    return new Promise(resolve => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Timeout after specified time
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Add CSS styles to the page
   */
  static addStyles(id: string, css: string): void {
    // Remove existing style if it exists
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Remove CSS styles from the page
   */
  static removeStyles(id: string): void {
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  /**
   * Create a popup with tables using the new TableDialog system
   */
  static createMuiPopup(config: {
    id: string;
    title: string;
    tables: Array<{
      title: string;
      headers: string[];
      rows: string[][];
      description?: string;
    }>;
    layoutMode?: 'standard' | 'dual-pane' | 'compact';
    itemsPerPage?: number;
    showOpenInNewTab?: boolean;
    enableSearch?: boolean;
  }): void {
    const tables = config.tables || [];

    // If multiple tables are provided, filter out the empty ones so the dialog
    // only shows categories that have rows. If only a single table is provided,
    // show it even if it's empty (caller likely expects the single table view).
    let tablesToShow: typeof tables = tables;
    if (tables.length > 1) {
      tablesToShow = tables.filter(t => Array.isArray(t.rows) && t.rows.length > 0);
    }

    if (tablesToShow.length === 0) {
      return;
    }

    TableDialog.show({
      id: config.id,
      title: config.title,
      tables: tablesToShow,
      layoutMode: config.layoutMode,
      itemsPerPage: config.itemsPerPage,
      showOpenInNewTab: config.showOpenInNewTab,
      enableSearch: config.enableSearch,
    });
  }

  /**
   * Show a lightweight toast notification via the sidebar
   */
  static showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    try {
      // Log to console as well for debugging
      DynamicsUtils._log(message, type);

      // Send message to background script to forward to sidebar
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime
          .sendMessage({
            type: 'SHOW_TOAST',
            message,
            severity: type,
          })
          .catch(() => {
            // Ignore errors if no listener is available (e.g., sidebar not open)
          });
      }
    } catch (e) {
      // Best-effort: if messaging fails, just log
      DynamicsUtils._log(message, type);
    }
  }

  // Internal logger helper to centralize console usage and make it easier to
  // suppress or replace for linting/build rules.
  private static _log(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    try {
      if (type === 'error') {
        // eslint-disable-next-line no-console
        console.error(`Level Up: ${message}`);
      } else if (type === 'success') {
        // eslint-disable-next-line no-console
        console.log(`Level Up: ${message}`);
      } else {
        // eslint-disable-next-line no-console
        console.info(`Level Up: ${message}`);
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Add click handler to logical name for copying to clipboard
   */
  static addClickHandlerToLogicalName(
    logicalName: string,
    typeOrHandler?: string | ((ev?: Event) => void),
    maybeHandler?: (ev?: Event) => void
  ): void {
    try {
      // Determine provided arguments: allow (logicalName, handler) or (logicalName, type, handler)
      let type = 'field';
      let handler: ((ev?: Event) => void) | undefined;

      if (typeof typeOrHandler === 'function') {
        handler = typeOrHandler as (ev?: Event) => void;
      } else if (typeof typeOrHandler === 'string') {
        type = typeOrHandler;
        if (typeof maybeHandler === 'function') {
          handler = maybeHandler;
        }
      }

      // Find the label element in the DOM
      let labelElement: HTMLElement | null = null;
      const classicMode = false;
      const CLASSIC_INLINE_LABEL = '.ms-crm-InlineEditLabelText';

      if (type === 'field') {
        // prettier-ignore
        labelElement = document.querySelector(`label[id$="${logicalName}-field-label"]`) as HTMLElement;
      } else if (type === 'tab') {
        // For tabs, find by tab name
        // prettier-ignore
        labelElement = document.querySelector(`[data-id="tablist-${logicalName}"]`) as HTMLElement;
        if (!labelElement) {
          // prettier-ignore
          labelElement = document.querySelector(`[aria-label*="${logicalName}"]`) as HTMLElement;
        }
      } else if (type === 'section') {
        // For sections, find by section name
        // prettier-ignore
        labelElement = document.querySelector(`[data-id*="${logicalName}"]`) as HTMLElement;
      }

      //classic mode field label
      if (!labelElement) {
        labelElement = frames[0].document.querySelector(`#${logicalName}_c`) as HTMLElement | null;
      }

      if (labelElement) {
        // Check if logical name span already exists to prevent duplication
        const existingLogicalName = labelElement.querySelector('.levelup-logical-name');
        if (existingLogicalName) {
          return; // Already processed, exit early
        }

        // Create a clickable span for the logical name part
        const textContent = labelElement.textContent || '';

        const clickableSpan = document.createElement('span');
        clickableSpan.className = 'levelup-logical-name';
        clickableSpan.style.cssText = `
          cursor: pointer;
          border: 1px solid #7b277a;
          border-radius: 4px;
          padding: 2px 8px;
          margin-top: 2px;
          font-size: 14px;
          font-family: 'SegoeUI', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 600;
          text-decoration: none;
          display: block;
          width: fit-content;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(99, 14, 96, 0.2);
          line-height: 1.2;
          text-align: left;
        `
          .replace(/\s+/g, ' ')
          .trim();
        clickableSpan.textContent = `${logicalName}`;
        clickableSpan.title = 'Click to copy logical name to clipboard';

        // Add hover and active states
        clickableSpan.addEventListener('mouseenter', () => {
          clickableSpan.style.borderColor = '#8e3d8b';
          clickableSpan.style.transform = 'translateY(-1px)';
          clickableSpan.style.boxShadow = '0 2px 6px rgba(99, 14, 96, 0.3)';
        });

        clickableSpan.addEventListener('mouseleave', () => {
          clickableSpan.style.borderColor = '#7b277a';
          clickableSpan.style.transform = 'translateY(0)';
          clickableSpan.style.boxShadow = '0 1px 2px rgba(99, 14, 96, 0.2)';
        });

        clickableSpan.addEventListener('mousedown', () => {
          clickableSpan.style.transform = 'translateY(0px)';
          clickableSpan.style.color = '#ffffff';
          clickableSpan.style.backgroundColor = '#4e0b4c';
        });

        // If a custom handler was provided, call it on click. Otherwise default to copying the logical name.
        clickableSpan.addEventListener('click', async event => {
          event.preventDefault();
          event.stopPropagation();

          if (handler) {
            try {
              // Call the provided handler; do not await returned promise to avoid
              // complicating the UI thread — handlers may perform async work.
              handler(event);
            } catch (error) {
              DynamicsUtils._log(`Click handler for logical name threw: ${String(error)}`, 'error');
            }
            return;
          }

          // Prevent overlapping animations/clicks
          if (clickableSpan.getAttribute('data-levelup-busy') === '1') {
            return;
          }
          clickableSpan.setAttribute('data-levelup-busy', '1');

          // Default copy-to-clipboard behavior
          try {
            await navigator.clipboard.writeText(logicalName);
            DynamicsUtils._log(`Copied "${logicalName}" to clipboard`, 'success');

            // Create a temporary notification element for better visibility
            const notification = document.createElement('div');
            notification.textContent = '✓ Copied!';
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #107c10;
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-weight: bold;
              z-index: 10000;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);

            // Also update the badge itself
            const originalText = clickableSpan.textContent;
            const originalStyle = clickableSpan.style.cssText;

            clickableSpan.textContent = '✓ Copied!';
            clickableSpan.style.backgroundColor = '#107c10 !important';
            clickableSpan.style.borderColor = '#107c10 !important';
            clickableSpan.style.color = '#ffffff !important';
            clickableSpan.style.fontWeight = 'bold !important';
            clickableSpan.style.transform = 'scale(1.1)';

            // Remove notification and restore badge after 1.5 seconds
            setTimeout(() => {
              notification.remove();
              clickableSpan.textContent = originalText;
              clickableSpan.style.cssText = originalStyle;
              clickableSpan.removeAttribute('data-levelup-busy');
            }, 1500);
          } catch (error) {
            DynamicsUtils._log(`Could not copy to clipboard: ${String(error)}`, 'error');

            // Create a temporary error notification
            const notification = document.createElement('div');
            notification.textContent = '✗ Copy Failed';
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #d83b01;
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-weight: bold;
              z-index: 10000;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);

            // Also update the badge itself
            const originalText = clickableSpan.textContent;
            const originalStyle = clickableSpan.style.cssText;

            clickableSpan.textContent = '✗ Failed';
            clickableSpan.style.backgroundColor = '#d83b01 !important';
            clickableSpan.style.borderColor = '#d83b01 !important';
            clickableSpan.style.color = '#ffffff !important';
            clickableSpan.style.fontWeight = 'bold !important';
            clickableSpan.style.transform = 'scale(1.1)';

            // Remove notification and restore badge after 1.5 seconds
            setTimeout(() => {
              notification.remove();
              clickableSpan.textContent = originalText;
              clickableSpan.style.cssText = originalStyle;
              clickableSpan.removeAttribute('data-levelup-busy');
            }, 1500);
          }
        });

        // Insert badge differently for classic vs modern DOM
        if (classicMode) {
          // For classic forms we don't want to wipe out the existing markup
          // (icons, gradient masks, etc). Insert the badge after the visible
          // label text span if possible.
          let anchor = labelElement.querySelector(CLASSIC_INLINE_LABEL) as HTMLElement | null;
          if (!anchor) {
            // fallback to first child text node or the labelElement itself
            anchor = labelElement.firstElementChild as HTMLElement | null;
          }
          if (anchor && anchor.parentElement) {
            anchor.insertAdjacentElement('afterend', clickableSpan);
          } else {
            // As a last resort append to the label element
            labelElement.appendChild(clickableSpan);
          }
        } else {
          // Replace the logical name part with the clickable span
          // Only modify if we haven't already processed this element
          const baseText = textContent.replace(/\s*\([^)]+\)$/, '').trim();

          // Clear existing content and rebuild to prevent duplication
          labelElement.textContent = baseText;

          // Add the logical name badge below the label text (centered)
          const lineBreak = document.createElement('br');
          labelElement.appendChild(lineBreak);
          labelElement.appendChild(clickableSpan);
        }
      }
    } catch (error) {
      DynamicsUtils._log(`Could not add click handler to logical name: ${String(error)}`, 'error');
    }
  }

  /**
   * Generic method to open a Dynamics 365 page
   */
  static openPage(config: NavigationConfig, description: string): string {
    let url: string;

    if (config.url) {
      // External URL or fully qualified URL
      url = config.url;
    } else {
      // Build Dynamics 365 URL
      const orgUrl = DynamicsUtils.getOrganizationUrl();
      const params = new URLSearchParams();

      if (config.entityName) {
        params.set('etn', config.entityName);
      }
      if (config.pageType) {
        params.set('pagetype', config.pageType);
      }
      if (config.area) {
        params.set('area', config.area);
      }

      // Add any additional parameters
      if (config.parameters) {
        Object.entries(config.parameters).forEach(([key, value]) => {
          params.set(key, value);
        });
      }

      url = `${orgUrl}/main.aspx?${params.toString()}`;
    }

    Xrm.Navigation.openUrl(url);
    return description;
  }
}
