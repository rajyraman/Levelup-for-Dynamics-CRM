import { ExtensionDisplayMode } from '#types/global';

const STORAGE_KEY = 'levelup_extension_config';

export interface ExtensionConfig {
  displayMode: ExtensionDisplayMode;
  showRecentlyUsed: boolean;
  showFavorites: boolean;
  showActionSections: boolean;
  showCustomCommands: boolean;
  showImpersonation: boolean;
  showGitHubIntegration: boolean;
  // Section-specific visibility for different modes
  showFormSection?: boolean;
  showNavigationSection?: boolean;
  showDebuggingSection?: boolean;
}

const DEFAULT_CONFIG: ExtensionConfig = {
  displayMode: 'default',
  showRecentlyUsed: true,
  showFavorites: true,
  showActionSections: true,
  showCustomCommands: true,
  showImpersonation: true,
  showGitHubIntegration: true,
  showFormSection: true,
  showNavigationSection: true,
  showDebuggingSection: true,
};

const DISPLAY_MODE_CONFIGS: Record<ExtensionDisplayMode, Partial<ExtensionConfig>> = {
  default: {
    showRecentlyUsed: true,
    showFavorites: true,
    showActionSections: true,
    showCustomCommands: true,
    showImpersonation: true,
    showGitHubIntegration: true,
    showFormSection: true,
    showNavigationSection: true,
    showDebuggingSection: true,
  },
  simple: {
    showRecentlyUsed: false,
    showFavorites: false,
    showActionSections: true,
    showCustomCommands: false,
    showImpersonation: false,
    showGitHubIntegration: false,
    showFormSection: true,
    showNavigationSection: true,
    showDebuggingSection: false,
  },
};

export class ExtensionConfigService {
  private static config: ExtensionConfig = DEFAULT_CONFIG;
  private static listeners: ((config: ExtensionConfig) => void)[] = [];

  /**
   * Initialize and load configuration from storage
   */
  static async initialize(): Promise<void> {
    await this.loadConfig();
  }

  /**
   * Get current configuration
   */
  static getConfig(): ExtensionConfig {
    return { ...this.config };
  }

  /**
   * Update display mode and apply its preset configuration
   */
  static async setDisplayMode(mode: ExtensionDisplayMode): Promise<void> {
    const modeConfig = DISPLAY_MODE_CONFIGS[mode];
    this.config = {
      ...this.config,
      displayMode: mode,
      ...modeConfig,
    };

    await this.saveConfig();
    this.notifyListeners();
  }

  /**
   * Update specific configuration property
   */
  static async updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };

    await this.saveConfig();
    this.notifyListeners();
  }

  /**
   * Subscribe to configuration changes
   */
  static subscribe(listener: (config: ExtensionConfig) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Load configuration from storage
   */
  private static async loadConfig(): Promise<void> {
    try {
      // Try chrome.storage.local first (more persistent)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        if (result[STORAGE_KEY]) {
          this.config = { ...DEFAULT_CONFIG, ...result[STORAGE_KEY] };
          return;
        }
      }

      // Fallback to localStorage
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<ExtensionConfig>;
          this.config = { ...DEFAULT_CONFIG, ...parsed };
          return;
        }
      }

      // Use default config if no saved configuration
      this.config = DEFAULT_CONFIG;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[ExtensionConfig] Error loading configuration:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  /**
   * Save configuration to storage
   */
  private static async saveConfig(): Promise<void> {
    try {
      const configToSave = JSON.stringify(this.config);

      // Save to chrome.storage.local if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: this.config });
      }

      // Also save to localStorage as fallback
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, configToSave);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[ExtensionConfig] Error saving configuration:', error);
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfig());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[ExtensionConfig] Error in config listener:', error);
      }
    });
  }

  /**
   * Reset configuration to defaults
   */
  static async reset(): Promise<void> {
    this.config = DEFAULT_CONFIG;
    await this.saveConfig();
    this.notifyListeners();
  }

  /**
   * Get display mode configurations
   */
  static getDisplayModeConfigs(): Record<ExtensionDisplayMode, Partial<ExtensionConfig>> {
    return DISPLAY_MODE_CONFIGS;
  }
}
