// Debugging utilities module for Dynamics 365

/// <reference types="xrm" />

export class DebuggingActions {
  /**
   * Utility function to add a parameter to the URL
   * @param paramName The name of the parameter to add
   * @param paramValue The value of the parameter
   * @param needsEncoding Whether the parameter value needs URL encoding
   * @returns Result message
   */
  private addUrlParameter(paramName: string, paramValue: string) {
    const currentUrl = window.location.href;

    // Parse current URL to check existing parameters
    const url = new URL(currentUrl);
    const currentParamValues = url.searchParams.getAll(paramName);
    // Only add if the parameter with this exact value doesn't already exist
    if (!currentParamValues.includes(paramValue)) {
      // Add the parameter (this will append it, not replace existing ones)
      url.searchParams.append(paramName, paramValue);
      // Navigate to the new URL
      window.location.href = url.toString();
    }
  }

  /**
   * Enable Forms Monitor by adding &monitor=true to the URL
   */
  enableFormsMonitor() {
    this.addUrlParameter('monitor', 'true');
  }

  /**
   * Enable Ribbon Debugger by adding &ribbondebug=true to the URL
   */
  enableRibbonDebugger() {
    this.addUrlParameter('ribbondebug', 'true');
  }

  /**
   * Disable Form Handlers by adding &flags=DisableFormHandlers%3Dtrue to the URL
   */
  disableFormHandlers() {
    this.addUrlParameter('flags', 'DisableFormHandlers=true');
  }

  /**
   * Disable Business Rule Handlers by adding &flags=DisableFormHandlers%3Dbusinessrule to the URL
   */
  disableBusinessRules() {
    this.addUrlParameter('flags', 'DisableFormHandlers=businessrule');
  }

  /**
   * Disable Form Libraries by adding &flags=DisableFormLibraries%3Dtrue to the URL
   */
  disableFormLibraries() {
    this.addUrlParameter('flags', 'DisableFormLibraries=true');
  }

  /**
   * Enable Dark Mode by adding &flags=themeoption%3Ddarkmode to the URL
   */
  enableDarkMode() {
    this.addUrlParameter('flags', 'themeoption=darkmode');
  }

  /**
   * Enable Performance Center by adding &perf=true to the URL
   */
  enablePerfCenter() {
    this.addUrlParameter('perf', 'true');
  }

  /**
   * Clear all flags by removing the flags parameter from the URL
   */
  clearFlags() {
    const currentUrl = window.location.href;

    // Check if flags parameter exists in the URL
    if (!currentUrl.includes('flags=')) {
      return;
    }

    // Remove the flags parameter and its value
    let newUrl = currentUrl;

    // Handle case where flags is the only parameter
    if (currentUrl.includes('?flags=') && !currentUrl.includes('&')) {
      newUrl = currentUrl.split('?flags=')[0];
    }
    // Handle case where flags is the first parameter but there are others
    else if (currentUrl.includes('?flags=')) {
      newUrl = currentUrl.replace(/\?flags=[^&]*(&)/, '?');
    }
    // Handle case where flags is not the first parameter
    else if (currentUrl.includes('&flags=')) {
      newUrl = currentUrl.replace(/&flags=[^&]*/, '');
    }

    // Navigate to the new URL if it's different
    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
    }
  }
}
