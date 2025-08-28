// Runtime Dynamics detection helpers (no URL-based heuristics)
// NOTE: URL-based detection has been intentionally removed. Use runtime checks
// against the page's Xrm global where possible.

// checkDynamicsViaXrm uses chrome APIs; keep it as an exported async function
export const checkDynamicsViaXrm = async (): Promise<boolean> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return false;
    }

    // Method 1: Try to use content script to check for Dynamics
    try {
      return await new Promise(resolve => {
        chrome.tabs.sendMessage(tab.id!, { type: 'GET_PAGE_CONTEXT' }, response => {
          if (chrome.runtime.lastError || !response?.success) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      // Fall through to script injection
    }

    // Method 2: Fallback - directly inject detection script (Xrm check + script tag heuristics)
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            if (typeof window !== 'undefined' && win.Xrm?.Utility?.getGlobalContext) {
              const version = win.Xrm.Utility.getGlobalContext().getVersion();
              if (version && version.startsWith('9.')) {
                return true;
              }
            }
          } catch (error) {
            // Continue with script detection
          }

          try {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            const hasDynamicsScript = scripts.some(script => {
              const src = (script as HTMLScriptElement).src;
              return (
                src.indexOf('/uclient/scripts') !== -1 ||
                src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
                src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
              );
            });

            return hasDynamicsScript;
          } catch (error) {
            return false;
          }
        },
      });

      return results && results[0] && results[0].result === true;
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Attempts to retrieve the Dynamics environment client URL from the active tab
 * by accessing `Xrm.Utility.getGlobalContext().getClientUrl()` in the page context.
 * Returns an empty string if unavailable.
 */
export const getEnvironmentUrlFromXrm = async (): Promise<string> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return '';
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            if (win.Xrm?.Utility?.getGlobalContext) {
              try {
                const ctx = win.Xrm.Utility.getGlobalContext();
                if (typeof ctx.getClientUrl === 'function') {
                  return ctx.getClientUrl();
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore
          }
          return '';
        },
      });

      if (results && results[0] && typeof results[0].result === 'string' && results[0].result) {
        return results[0].result as string;
      }
    } catch (error) {
      return '';
    }
  } catch (error) {
    return '';
  }

  return '';
};
