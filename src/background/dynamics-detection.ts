// Dynamics 365 detection utilities for background service worker
// These functions are used exclusively in the background script for detecting Dynamics pages

/// <reference types="xrm" />

export interface DynamicsDetectionResult {
  isDynamics: boolean;
  detectionMethod: 'xrm-api' | 'failed';
  version?: string;
}

/**
 * Detect if current page is Dynamics 365 using Xrm API (most reliable method)
 * This should be executed in the page context (content script or injected script)
 */
export async function detectDynamicsInPageContext(): Promise<DynamicsDetectionResult> {
  const maxRetries = 3;
  const retryDelay = 500; // 500ms between retries

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (typeof window !== 'undefined' && window.Xrm) {
        const version = window.Xrm.Utility?.getGlobalContext()?.getVersion();
        const isDynamics = Boolean(version && version.startsWith('9.'));

        if (isDynamics) {
          return {
            isDynamics: true,
            detectionMethod: 'xrm-api',
            version,
          };
        }
      }
    } catch (error) {
      // Silent failure for retry logic
      void error;
    }

    // Wait before next attempt (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // No Xrm found, not Dynamics
  return {
    isDynamics: false,
    detectionMethod: 'failed',
  };
}

/**
 * Execute Dynamics detection in a tab from background script
 * Uses chrome.scripting.executeScript to run detection in page context
 */
export async function detectDynamicsInTab(tabId: number): Promise<DynamicsDetectionResult> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Only check for Xrm API - no URL detection
        try {
          if (typeof window !== 'undefined' && (window as any).Xrm) {
            const version = (window as any).Xrm.Utility?.getGlobalContext()?.getVersion();
            if (version && version.startsWith('9.')) {
              return {
                isDynamics: true,
                detectionMethod: 'xrm-api' as const,
                version,
              };
            }
          }
        } catch (error) {
          // Ignore Xrm errors
        }

        return {
          isDynamics: false,
          detectionMethod: 'failed' as const,
        };
      },
    });

    return results?.[0]?.result || { isDynamics: false, detectionMethod: 'failed' };
  } catch (error) {
    return { isDynamics: false, detectionMethod: 'failed' };
  }
}
