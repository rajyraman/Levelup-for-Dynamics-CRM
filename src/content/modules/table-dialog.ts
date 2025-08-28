/**
 * Lightweight table dialog component for Level Up extension
 * Clean, maintainable solution for displaying data tables in dialogs
 */

export interface TableData {
  title: string;
  description?: string;
  headers: string[];
  rows: string[][];
  allowHtmlInColumns?: number[]; // Array of column indices that allow HTML content
}

export interface DialogOptions {
  id?: string;
  title: string;
  tables: TableData[];
  onClose?: () => void;
  // Enhanced options for large datasets
  layoutMode?: 'standard' | 'dual-pane' | 'compact';
  showOpenInNewTab?: boolean;
  itemsPerPage?: number;
  enableSearch?: boolean;
  maxWidth?: string;
  maxHeight?: string;
}

export class TableDialog {
  private static readonly CSS = `
    .levelup-dialog-backdrop {
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
    }

    .levelup-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: min(1200px, 90vw);
      max-height: min(85vh, 80vh);
      width: min(95vw, 90vw);
      overflow: hidden;
      font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      flex-direction: column;
      margin: 20px;
      animation: slideIn 0.3s ease-out;
    }

    .levelup-dialog.dual-pane {
      max-width: min(1400px, 95vw);
      max-height: min(90vh, 85vh);
      width: 95vw;
      height: 85vh;
    }

    .levelup-dialog.compact {
      max-width: min(600px, 50vw);
      max-height: min(70vh, 50vh);
    }

    .levelup-dialog-header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 20px 24px;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .levelup-dialog-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .levelup-dialog-action-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .levelup-dialog-action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .levelup-dialog-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.9);
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      line-height: 1;
    }

    .levelup-dialog-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .levelup-dialog-content {
      flex: 1;
      overflow: hidden;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .levelup-dialog-content:not(.dual-pane-layout) {
      overflow-y: auto;
    }

    .levelup-dialog-content.dual-pane-layout {
      flex-direction: row;
    }

    .levelup-table-nav {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 20px;
      margin: 0;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .levelup-dialog-content:not(.dual-pane-layout) .levelup-table-nav {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .levelup-table-nav.dual-pane-nav {
      border-bottom: none;
      border-right: 1px solid #e2e8f0;
      width: 25%;
      min-width: 280px;
      max-width: 30%;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: none;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .levelup-table-nav-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      position: sticky;
      top: 0;
      background: white;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .levelup-table-nav-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .levelup-table-nav.dual-pane-nav .levelup-table-nav-links {
      flex-direction: column;
      flex-wrap: nowrap;
      gap: 4px;
    }

    .levelup-table-nav-link {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: #f1f5f9;
      color: #475569;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid #e2e8f0;
      word-break: break-word;
      text-align: left;
      justify-content: flex-start;
    }

    .levelup-table-nav-link:hover {
      background: #e2e8f0;
      color: #334155;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .levelup-table-nav-link.active {
      background: #2563eb;
      color: white;
      border-color: #1d4ed8;
    }

    .levelup-table-nav-link:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .levelup-table-nav-link small {
      padding-left: 8px;
      opacity: 0.8;
      font-weight: normal;
    }

    .levelup-table-content-area {
      flex: 1;
      width: 75%;
      overflow-y: auto;
      min-height: 0;
      background: #f8fafc;
    }

    .levelup-table-section {
      margin: 20px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      overflow: visible;
      scroll-margin-top: 100px;
      flex-shrink: 0;
    }

    .dual-pane-layout .levelup-table-section {
      scroll-margin-top: 20px;
      margin: 16px;
    }

    .levelup-table-section:first-child {
      margin-top: 20px;
    }

    .levelup-table-section:last-child {
      margin-bottom: 20px;
    }

    .levelup-table-header {
      background: linear-gradient(180deg, #f8fafc, #f1f5f9);
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .levelup-table-search {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 20px 20px 16px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 9;
    }

    .levelup-table-search-icon {
      color: #6b7280;
      font-size: 14px;
      opacity: 0.7;
    }

    .levelup-table-search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: #374151;
      background: transparent;
      min-width: 0;
    }

    .levelup-table-search-input::placeholder {
      color: #9ca3af;
    }

    .levelup-table-search-clear {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 16px;
      line-height: 1;
      opacity: 0.7;
      transition: all 0.2s ease;
    }

    .levelup-table-search-clear:hover {
      opacity: 1;
      background: #f3f4f6;
    }

    .levelup-table-search-clear.hidden {
      display: none;
    }

    .levelup-table-search-results {
      padding: 8px 20px;
      font-size: 12px;
      color: #6b7280;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }

    .levelup-table-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .levelup-table-description {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      line-height: 1.4;
    }

    .levelup-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      background: white;
      table-layout: fixed;
    }

    .levelup-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .levelup-table th:first-child {
      width: 25%;
      min-width: 120px;
    }

    .levelup-table th:nth-child(2) {
      width: 40%;
      min-width: 200px;
    }

    .levelup-table th:nth-child(3) {
      width: 20%;
      min-width: 100px;
    }

    .levelup-table th:last-child {
      width: 15%;
      min-width: 90px;
    }

    .levelup-table td {
      padding: 8px 16px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .levelup-table td a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .levelup-table td a:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    .levelup-table tbody tr:hover {
      background: #f8fafc;
    }

    .levelup-table tbody tr:last-child td {
      border-bottom: none;
    }

    .levelup-table .value-cell {
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 12px;
      color: #2563eb;
      background: rgba(37, 99, 235, 0.03);
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      max-width: none;
    }

    .levelup-table .empty-row td {
      padding: 32px 16px;
      text-align: center;
      color: #9ca3af;
      font-style: italic;
    }

    .levelup-virtual-container {
      height: 400px;
      overflow-y: auto;
      position: relative;
    }

    .levelup-virtual-spacer {
      pointer-events: none;
    }

    .levelup-virtual-items {
      will-change: transform;
    }

    .levelup-pagination {
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: between;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .levelup-pagination-info {
      font-size: 13px;
      color: #64748b;
      flex: 1;
    }

    .levelup-pagination-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .levelup-pagination-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .levelup-pagination-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .levelup-pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .levelup-pagination-btn.active {
      background: #2563eb;
      color: white;
      border-color: #1d4ed8;
    }

    .levelup-dialog-content::-webkit-scrollbar,
    .levelup-table-nav::-webkit-scrollbar,
    .levelup-table-content-area::-webkit-scrollbar,
    .levelup-virtual-container::-webkit-scrollbar,
    .levelup-table-nav-links::-webkit-scrollbar {
      width: 6px;
    }

    .levelup-dialog-content::-webkit-scrollbar-track,
    .levelup-table-nav::-webkit-scrollbar-track,
    .levelup-table-content-area::-webkit-scrollbar-track,
    .levelup-virtual-container::-webkit-scrollbar-track,
    .levelup-table-nav-links::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .levelup-dialog-content::-webkit-scrollbar-thumb,
    .levelup-table-nav::-webkit-scrollbar-thumb,
    .levelup-table-content-area::-webkit-scrollbar-thumb,
    .levelup-virtual-container::-webkit-scrollbar-thumb,
    .levelup-table-nav-links::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .levelup-dialog-content::-webkit-scrollbar-thumb:hover,
    .levelup-table-nav::-webkit-scrollbar-thumb:hover,
    .levelup-table-content-area::-webkit-scrollbar-thumb:hover,
    .levelup-virtual-container::-webkit-scrollbar-thumb:hover,
    .levelup-table-nav-links::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 768px) {
      .levelup-dialog {
        margin: 10px;
        max-height: calc(100vh - 20px);
        width: calc(100vw - 20px);
        max-width: calc(100vw - 20px);
      }

      .levelup-dialog.dual-pane {
        width: calc(100vw - 10px);
        height: calc(100vh - 10px);
        max-width: none;
        max-height: none;
        margin: 5px;
      }

      .levelup-dialog-content.dual-pane-layout {
        flex-direction: column;
      }

      .levelup-table-nav.dual-pane-nav {
        width: auto;
        min-width: auto;
        max-width: none;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        max-height: 150px;
        flex-shrink: 0;
      }

      .levelup-table-content-area {
        width: 100%;
      }

      .levelup-table-nav.dual-pane-nav .levelup-table-nav-links {
        flex-direction: row;
        flex-wrap: wrap;
        max-height: 100px;
        overflow-y: auto;
      }

      .levelup-dialog-header {
        padding: 16px 20px;
        font-size: 16px;
      }

      .levelup-table-section {
        margin: 16px;
      }

      .levelup-table-nav {
        padding: 12px 16px;
      }

      .levelup-table-nav-links {
        gap: 6px;
      }

      .levelup-table-nav-link {
        padding: 5px 10px;
        font-size: 12px;
      }

      .levelup-table th,
      .levelup-table td {
        padding: 8px 12px;
        font-size: 12px;
      }

      .levelup-table th:first-child {
        width: 30%;
        min-width: 100px;
      }

      .levelup-table th:nth-child(2) {
        width: 45%;
        min-width: 150px;
      }

      .levelup-table th:nth-child(3) {
        width: 15%;
        min-width: 80px;
      }

      .levelup-table th:last-child {
        width: 10%;
        min-width: 70px;
      }

      .levelup-dialog-action-btn {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  `;

  private static styleInjected = false;

  private static injectStyles(): void {
    if (this.styleInjected) {
      return;
    }

    const style = document.createElement('style');
    style.textContent = this.CSS;
    document.head.appendChild(style);
    this.styleInjected = true;
  }

  private static createTableHTML(table: TableData, index: number): string {
    const tableId = `levelup-table-${index}`;
    const hasDescription = table.description
      ? `
          <p class="levelup-table-description">${this.escapeHtml(table.description)}</p>
        `
      : '';

    const tableRows =
      table.rows.length > 0
        ? table.rows
            .map(
              (row, rowIndex) => `
                <tr data-row-index="${rowIndex}">
                  ${row
                    .map((cell, cellIndex) => {
                      const isLastCell = cellIndex === row.length - 1;
                      const cellClass = isLastCell ? 'value-cell' : '';
                      const allowHtml =
                        table.allowHtmlInColumns && table.allowHtmlInColumns.includes(cellIndex);
                      const cellContent = allowHtml ? cell : this.escapeHtml(cell);
                      const cellTitle = this.escapeHtml(
                        allowHtml ? cell.replace(/<[^>]*>/g, '') : cell
                      ); // Strip HTML for title
                      return `<td class="${cellClass}" title="${cellTitle}">${cellContent}</td>`;
                    })
                    .join('')}
                </tr>
              `
            )
            .join('')
        : `<tr class="empty-row">
             <td colspan="${table.headers.length}">No data available</td>
           </tr>`;

    const tableHeaders = table.headers
      .map(header => `<th>${this.escapeHtml(header)}</th>`)
      .join('');

    return `
      <div class="levelup-table-section" id="${tableId}">
        <div class="levelup-table-header">
          <h3 class="levelup-table-title">${this.escapeHtml(table.title)}</h3>
          ${hasDescription}
        </div>
        <table class="levelup-table">
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody id="${tableId}-tbody">
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private static createTableWithSearchHTML(table: TableData, index: number): string {
    const tableId = `levelup-table-${index}`;
    const searchId = `levelup-search-${index}`;
    const hasDescription = table.description
      ? `
          <p class="levelup-table-description">${this.escapeHtml(table.description)}</p>
        `
      : '';

    const tableRows =
      table.rows.length > 0
        ? table.rows
            .map(
              (row, rowIndex) => `
                <tr data-row-index="${rowIndex}" data-searchable="${this.escapeHtml(row.join(' ').toLowerCase())}">
                  ${row
                    .map((cell, cellIndex) => {
                      const isLastCell = cellIndex === row.length - 1;
                      const cellClass = isLastCell ? 'value-cell' : '';
                      const allowHtml =
                        table.allowHtmlInColumns && table.allowHtmlInColumns.includes(cellIndex);
                      const cellContent = allowHtml ? cell : this.escapeHtml(cell);
                      const cellTitle = this.escapeHtml(
                        allowHtml ? cell.replace(/<[^>]*>/g, '') : cell
                      ); // Strip HTML for title
                      return `<td class="${cellClass}" title="${cellTitle}">${cellContent}</td>`;
                    })
                    .join('')}
                </tr>
              `
            )
            .join('')
        : `<tr class="empty-row">
             <td colspan="${table.headers.length}">No data available</td>
           </tr>`;

    const tableHeaders = table.headers
      .map(header => `<th>${this.escapeHtml(header)}</th>`)
      .join('');

    return `
      <div class="levelup-table-section" id="${tableId}">
        <div class="levelup-table-header">
          <h3 class="levelup-table-title">${this.escapeHtml(table.title)}</h3>
          ${hasDescription}
        </div>
        <div class="levelup-table-search">
          <span class="levelup-table-search-icon">🔍</span>
          <input
            type="text"
            class="levelup-table-search-input"
            id="${searchId}"
            placeholder="Search..."
            data-table-id="${tableId}"
          />
          <button class="levelup-table-search-clear hidden" data-search-id="${searchId}">×</button>
        </div>
        <div class="levelup-table-search-results" id="${searchId}-results" style="display: none;"></div>
        <table class="levelup-table">
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody id="${tableId}-tbody">
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private static createTableOfContents(tables: TableData[], layoutMode = 'standard'): string {
    // Always show navigation in dual-pane mode, regardless of table count
    if (layoutMode === 'dual-pane' || tables.length > 1) {
      const navLinks = tables
        .map(
          (table, index) => `
            <a class="levelup-table-nav-link" href="#levelup-table-${index}" data-table-index="${index}">
              ${this.escapeHtml(table.title)}
              ${table.rows.length > 0 ? `<small> (${table.rows.length})</small>` : ''}
            </a>
          `
        )
        .join('');

      const navClass =
        layoutMode === 'dual-pane' ? 'levelup-table-nav dual-pane-nav' : 'levelup-table-nav';

      return `
        <div class="${navClass}">
          <div class="levelup-table-nav-title">Quick Navigation</div>
          <div class="levelup-table-nav-links">
            ${navLinks}
          </div>
        </div>
      `;
    }

    return '';
  }

  private static generateNewTabHTML(options: DialogOptions): string {
    const layoutMode = options.layoutMode || 'standard';
    const tableOfContents = this.createTableOfContents(options.tables, layoutMode);
    const tablesHTML = options.tables
      .map((table, index) => {
        if (options.enableSearch) {
          return this.createTableWithSearchHTML(table, index);
        }
        return this.createTableHTML(table, index);
      })
      .join('');

    // Determine content CSS classes based on layout mode
    const contentClasses = ['levelup-dialog-content'];
    if (layoutMode === 'dual-pane') {
      contentClasses.push('dual-pane-layout');
    }

    const contentArea =
      layoutMode === 'dual-pane'
        ? `<div class="levelup-table-content-area">${tablesHTML}</div>`
        : tablesHTML;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(options.title)} - Level Up Extension</title>
    <style>
        ${this.CSS.replace('.levelup-dialog-backdrop', 'body')
          .replace('.levelup-dialog', '.levelup-content')
          .replace('position: fixed;', 'position: relative;')
          .replace('z-index: 10000;', 'z-index: 1;')
          .replace('animation: fadeIn 0.2s ease-out;', '')
          .replace('animation: slideIn 0.3s ease-out;', '')
          .replace('max-width: min(1200px, 90vw);', 'max-width: none;')
          .replace('width: min(95vw, 90vw);', 'width: 100%;')}

        body {
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .levelup-content {
            margin: 0;
            width: 100%;
            height: 100vh;
            max-width: none;
            max-height: none;
            border-radius: 0;
            box-shadow: none;
        }

        .levelup-dialog-header {
            position: sticky;
            top: 0;
            z-index: 100;
        }

        @media print {
            .levelup-dialog-header { display: none; }
            .levelup-table-nav { display: none; }
        }
    </style>
</head>
<body>
    <div class="levelup-content">
        <div class="levelup-dialog-header">
            <span>${this.escapeHtml(options.title)}</span>
            <div>
                <button class="levelup-dialog-close" onclick="window.close()">×</button>
            </div>
        </div>
        <div class="${contentClasses.join(' ')}">
            ${tableOfContents}
            ${contentArea}
        </div>
    </div>
    <script>
        // Add navigation functionality
        document.querySelectorAll('.levelup-table-nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Add pagination functionality for virtualized tables
        ${this.getPaginationScript()}

        // Add search functionality
        ${options.enableSearch ? this.getSearchScript() : ''}
    </script>
</body>
</html>`;
  }

  private static getSearchScript(): string {
    return `
        // Search functionality for new tab
        window.addEventListener('DOMContentLoaded', () => {
            const searchInputs = document.querySelectorAll('.levelup-table-search-input');

            searchInputs.forEach(input => {
                const searchInput = input;
                const tableId = searchInput.dataset.tableId;
                const searchId = searchInput.id;
                const clearButton = document.querySelector('[data-search-id="' + searchId + '"]');
                const resultsDiv = document.querySelector('#' + searchId + '-results');
                const tbody = document.querySelector('#' + tableId + '-tbody');

                if (!tbody || !clearButton || !resultsDiv) return;

                const allRows = Array.from(tbody.querySelectorAll('tr[data-searchable]'));

                const performSearch = () => {
                    const searchTerm = searchInput.value.toLowerCase().trim();

                    if (searchTerm === '') {
                        allRows.forEach(row => { row.style.display = ''; });
                        clearButton.classList.add('hidden');
                        resultsDiv.style.display = 'none';
                        return;
                    }

                    let visibleCount = 0;
                    allRows.forEach(row => {
                        const searchableText = row.dataset.searchable || '';
                        if (searchableText.includes(searchTerm)) {
                            row.style.display = '';
                            visibleCount++;
                        } else {
                            row.style.display = 'none';
                        }
                    });

                    clearButton.classList.remove('hidden');
                    resultsDiv.style.display = 'block';
                    resultsDiv.textContent = visibleCount + ' of ' + allRows.length + ' fields match "' + searchInput.value + '"';
                };

                const clearSearch = () => {
                    searchInput.value = '';
                    performSearch();
                    searchInput.focus();
                };

                searchInput.addEventListener('input', performSearch);
                searchInput.addEventListener('keydown', e => {
                    if (e.key === 'Escape') clearSearch();
                });

                clearButton.addEventListener('click', clearSearch);
            });
        });
    `;
  }

  private static getPaginationScript(): string {
    return `
        // Pagination functionality
        function updateTablePage(tableId, page, totalPages, itemsPerPage, allRows) {
            const tbody = document.getElementById(tableId + '-tbody');
            const pagination = document.getElementById(tableId + '-pagination');

            if (!tbody || !pagination) return;

            const start = (page - 1) * itemsPerPage;
            const end = Math.min(start + itemsPerPage, allRows.length);

            // Update table rows
            tbody.innerHTML = allRows.slice(start, end).map(row =>
                '<tr>' + row.map((cell, cellIndex) => {
                    const isLastCell = cellIndex === row.length - 1;
                    const cellClass = isLastCell ? 'value-cell' : '';
                    return '<td class="' + cellClass + '" title="' + cell.replace(/"/g, '&quot;') + '">' + cell + '</td>';
                }).join('') + '</tr>'
            ).join('');

            // Update pagination info
            const rangeSpan = pagination.querySelector('.current-range');
            if (rangeSpan) {
                rangeSpan.textContent = (start + 1) + '-' + end;
            }

            // Update pagination buttons
            const firstBtn = pagination.querySelector('[data-action="first"]');
            const prevBtn = pagination.querySelector('[data-action="prev"]');
            const nextBtn = pagination.querySelector('[data-action="next"]');
            const lastBtn = pagination.querySelector('[data-action="last"]');

            if (firstBtn) firstBtn.disabled = page === 1;
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = page === totalPages;
            if (lastBtn) lastBtn.disabled = page === totalPages;
        }

        // Initialize pagination for all virtualized tables
        window.addEventListener('DOMContentLoaded', () => {
            const tables = document.querySelectorAll('.levelup-table-section[data-total-items]');

            tables.forEach(tableSection => {
                const tableId = tableSection.id;
                const totalItems = parseInt(tableSection.dataset.totalItems);
                const itemsPerPage = parseInt(tableSection.dataset.itemsPerPage);
                const totalPages = Math.ceil(totalItems / itemsPerPage);

                // This would need the actual data to be embedded in the page
                // For now, we'll skip the pagination implementation in new tab
                // as it requires the original data context
            });
        });
    `;
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static show(options: DialogOptions): void {
    this.injectStyles();

    const dialogId =
      options.id || `levelup-dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const layoutMode = options.layoutMode || 'standard';
    const itemsPerPage = options.itemsPerPage || 50;

    // Remove any existing dialogs with the same base ID or all dialogs if no specific ID
    if (options.id) {
      // Remove existing dialog with same ID
      const existingById = document.getElementById(`${options.id}-backdrop`);
      if (existingById) {
        existingById.remove();
      }
    } else {
      // Remove all existing dialogs to prevent stacking
      const existingDialogs = document.querySelectorAll('.levelup-dialog-backdrop');
      existingDialogs.forEach(dialog => dialog.remove());
    }

    // Determine if we should use dual-pane layout
    const shouldUseDualPane =
      layoutMode === 'dual-pane' || (options.tables.length > 1 && layoutMode !== 'compact');

    const finalLayoutMode = shouldUseDualPane ? 'dual-pane' : layoutMode;

    const tableOfContents = this.createTableOfContents(options.tables, finalLayoutMode);
    const tablesHTML = options.tables
      .map((table, index) => {
        // Use search functionality if enabled
        if (options.enableSearch) {
          return this.createTableWithSearchHTML(table, index);
        }
        return this.createTableHTML(table, index);
      })
      .join('');

    // Determine dialog CSS classes
    const dialogClasses = ['levelup-dialog'];
    if (finalLayoutMode === 'dual-pane') {
      dialogClasses.push('dual-pane');
    } else if (finalLayoutMode === 'compact') {
      dialogClasses.push('compact');
    }

    // Determine content CSS classes
    const contentClasses = ['levelup-dialog-content'];
    if (finalLayoutMode === 'dual-pane') {
      contentClasses.push('dual-pane-layout');
    }

    // Build header actions
    let headerActions = '';
    if (options.showOpenInNewTab !== false) {
      headerActions += `
        <button class="levelup-dialog-action-btn" data-action="open-new-tab" title="Open in new tab">
          <span>↗</span> New Tab
        </button>
      `;
    }

    const contentArea =
      finalLayoutMode === 'dual-pane'
        ? `<div class="levelup-table-content-area">${tablesHTML}</div>`
        : tablesHTML;

    const dialogHTML = `
      <div class="levelup-dialog-backdrop" id="${dialogId}-backdrop">
        <div class="${dialogClasses.join(' ')}" id="${dialogId}">
          <div class="levelup-dialog-header">
            <span>${this.escapeHtml(options.title)}</span>
            <div class="levelup-dialog-header-actions">
              ${headerActions}
              <button class="levelup-dialog-close" aria-label="Close dialog">×</button>
            </div>
          </div>
          <div class="${contentClasses.join(' ')}">
            ${tableOfContents}
            ${contentArea}
          </div>
        </div>
      </div>
    `;

    const dialogElement = document.createElement('div');
    dialogElement.innerHTML = dialogHTML;
    document.body.appendChild(dialogElement.firstElementChild!);

    // Store data for pagination and new tab functionality
    const backdrop = document.getElementById(`${dialogId}-backdrop`);
    if (backdrop) {
      (
        backdrop as HTMLElement & { _tableData: TableData[]; _dialogOptions: DialogOptions }
      )._tableData = options.tables;
      (
        backdrop as HTMLElement & { _tableData: TableData[]; _dialogOptions: DialogOptions }
      )._dialogOptions = options;
    }

    // Add event listeners
    this.setupEventListeners(dialogId, options, itemsPerPage, finalLayoutMode);
  }

  private static setupEventListeners(
    dialogId: string,
    options: DialogOptions,
    itemsPerPage: number,
    layoutMode: string
  ): void {
    const backdrop = document.getElementById(`${dialogId}-backdrop`);
    const closeButton = backdrop?.querySelector('.levelup-dialog-close') as HTMLButtonElement;
    const contentArea = backdrop?.querySelector(
      layoutMode === 'dual-pane' ? '.levelup-table-content-area' : '.levelup-dialog-content'
    ) as HTMLElement;

    const closeDialog = () => {
      // Remove any existing keydown listeners
      document.removeEventListener('keydown', handleKeydown);
      backdrop?.remove();
      options.onClose?.();
    };

    // Handle navigation links
    const navLinks = backdrop?.querySelectorAll('.levelup-table-nav-link');
    navLinks?.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();

        // Update active state
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');

        const targetId = link.getAttribute('href')?.substring(1);
        if (targetId) {
          const targetElement = document.getElementById(targetId);
          const navElement = backdrop?.querySelector('.levelup-table-nav') as HTMLElement;
          if (targetElement && contentArea) {
            // Calculate offset accounting for sticky navigation height
            const navHeight =
              layoutMode === 'dual-pane' ? 0 : navElement ? navElement.offsetHeight : 0;
            const targetOffset = targetElement.offsetTop - contentArea.offsetTop - navHeight - 10;

            contentArea.scrollTo({
              top: Math.max(0, targetOffset),
              behavior: 'smooth',
            });
          }
        }
      });
    });

    // Handle new tab button
    const newTabButton = backdrop?.querySelector('[data-action="open-new-tab"]');
    newTabButton?.addEventListener('click', () => {
      this.openInNewTab(options);
    });

    // Setup pagination for virtualized tables if needed
    this.setupPagination(backdrop, options.tables, itemsPerPage);

    // Setup search functionality
    if (options.enableSearch) {
      this.setupSearch(backdrop);
    }

    // Close on backdrop click
    backdrop?.addEventListener('click', e => {
      if (e.target === backdrop) {
        closeDialog();
      }
    });

    // Close on close button click
    closeButton?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      closeDialog();
    });

    // Close on Escape key
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDialog();
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Focus management
    closeButton?.focus();
  }

  private static openInNewTab(options: DialogOptions): void {
    const html = this.generateNewTabHTML(options);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    // Clean up the URL after a delay to prevent memory leaks
    if (newWindow) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  private static setupPagination(
    backdrop: HTMLElement | null,
    tables: TableData[],
    itemsPerPage: number
  ): void {
    if (!backdrop) {
      return;
    }

    tables.forEach((table, tableIndex) => {
      if (table.rows.length <= itemsPerPage) {
        return;
      }

      const tableId = `levelup-table-${tableIndex}`;
      const pagination = backdrop.querySelector(`#${tableId}-pagination`);
      const tbody = backdrop.querySelector(`#${tableId}-tbody`);

      if (!pagination || !tbody) {
        return;
      }

      let currentPage = 1;
      const totalPages = Math.ceil(table.rows.length / itemsPerPage);

      const updatePage = (page: number) => {
        currentPage = page;
        const start = (page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, table.rows.length);

        // Update table rows
        tbody.innerHTML = table.rows
          .slice(start, end)
          .map(
            row => `
              <tr>
                ${row
                  .map((cell, cellIndex) => {
                    const isLastCell = cellIndex === row.length - 1;
                    const cellClass = isLastCell ? 'value-cell' : '';
                    return `<td class="${cellClass}" title="${this.escapeHtml(cell)}">${this.escapeHtml(cell)}</td>`;
                  })
                  .join('')}
              </tr>
            `
          )
          .join('');

        // Update pagination info
        const rangeSpan = pagination.querySelector('.current-range');
        if (rangeSpan) {
          rangeSpan.textContent = `${start + 1}-${end}`;
        }

        // Update pagination buttons
        const firstBtn = pagination.querySelector('[data-action="first"]') as HTMLButtonElement;
        const prevBtn = pagination.querySelector('[data-action="prev"]') as HTMLButtonElement;
        const nextBtn = pagination.querySelector('[data-action="next"]') as HTMLButtonElement;
        const lastBtn = pagination.querySelector('[data-action="last"]') as HTMLButtonElement;

        if (firstBtn) {
          firstBtn.disabled = page === 1;
        }
        if (prevBtn) {
          prevBtn.disabled = page === 1;
        }
        if (nextBtn) {
          nextBtn.disabled = page === totalPages;
        }
        if (lastBtn) {
          lastBtn.disabled = page === totalPages;
        }

        // Update page numbers
        const pagesContainer = pagination.querySelector('.levelup-pagination-pages');
        if (pagesContainer) {
          const pageNumbers = [];
          const showPages = 5;
          let startPage = Math.max(1, page - Math.floor(showPages / 2));
          const endPage = Math.min(totalPages, startPage + showPages - 1);
          startPage = Math.max(1, endPage - showPages + 1);

          for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(`
              <button class="levelup-pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">
                ${i}
              </button>
            `);
          }
          pagesContainer.innerHTML = pageNumbers.join('');

          // Add click handlers for page numbers
          pagesContainer.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetPage = parseInt((btn as HTMLElement).dataset.page || '1');
              updatePage(targetPage);
            });
          });
        }
      };

      // Add pagination button handlers
      pagination.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;

        if (action && !target.hasAttribute('disabled')) {
          switch (action) {
            case 'first':
              updatePage(1);
              break;
            case 'prev':
              updatePage(Math.max(1, currentPage - 1));
              break;
            case 'next':
              updatePage(Math.min(totalPages, currentPage + 1));
              break;
            case 'last':
              updatePage(totalPages);
              break;
          }
        }
      });

      // Initialize first page
      updatePage(1);
    });
  }

  private static setupSearch(backdrop: HTMLElement | null): void {
    if (!backdrop) {
      return;
    }

    const searchInputs = backdrop.querySelectorAll('.levelup-table-search-input');

    searchInputs.forEach(input => {
      const searchInput = input as HTMLInputElement;
      const tableId = searchInput.dataset.tableId;
      const searchId = searchInput.id;
      const clearButton = backdrop.querySelector(
        `[data-search-id="${searchId}"]`
      ) as HTMLButtonElement;
      const resultsDiv = backdrop.querySelector(`#${searchId}-results`) as HTMLElement;
      const tbody = backdrop.querySelector(`#${tableId}-tbody`) as HTMLElement;

      if (!tbody || !clearButton || !resultsDiv) {
        return;
      }

      const allRows = Array.from(tbody.querySelectorAll('tr[data-searchable]')) as HTMLElement[];

      const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (searchTerm === '') {
          // Show all rows
          allRows.forEach(row => {
            row.style.display = '';
          });
          clearButton.classList.add('hidden');
          resultsDiv.style.display = 'none';
          return;
        }

        // Filter rows
        let visibleCount = 0;
        allRows.forEach(row => {
          const searchableText = row.dataset.searchable || '';
          if (searchableText.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
          } else {
            row.style.display = 'none';
          }
        });

        // Update UI
        clearButton.classList.remove('hidden');
        resultsDiv.style.display = 'block';
        resultsDiv.textContent = `${visibleCount} of ${allRows.length} fields match "${searchInput.value}"`;
      };

      const clearSearch = () => {
        searchInput.value = '';
        performSearch();
        searchInput.focus();
      };

      // Event listeners
      searchInput.addEventListener('input', performSearch);
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          clearSearch();
        }
      });

      clearButton.addEventListener('click', clearSearch);
    });
  }

  static close(id?: string): void {
    if (id) {
      const dialog = document.getElementById(`${id}-backdrop`);
      dialog?.remove();
    } else {
      // Close all dialogs
      const dialogs = document.querySelectorAll('.levelup-dialog-backdrop');
      dialogs.forEach(dialog => dialog.remove());
    }
  }
}
