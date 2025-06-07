/**
 * Global Settings Manager
 * Manages application-wide settings including Default Crawl Location and Extension Token
 */
class SettingsManager {
  constructor() {
    this.settings = {
      defaultCrawlLocation: "",
      extensionToken: "",
      autoSaveSettings: true,
      showNotifications: true,
      debugMode: false,
    };

    this.listeners = new Map();
    this.storageKey = "zalo-crawler-settings";

    // Load settings from storage
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem(this.storageKey);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsed };
        console.log("Settings loaded:", this.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      console.log("Settings saved:", this.settings);

      // Notify listeners
      this.notifyListeners("settingsSaved", this.settings);

      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }

  /**
   * Get a specific setting value
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Set a specific setting value
   */
  set(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;

    // Auto-save if enabled
    if (this.settings.autoSaveSettings) {
      this.saveSettings();
    }

    // Notify listeners of specific setting change
    this.notifyListeners(`setting:${key}`, { oldValue, newValue: value });
    this.notifyListeners("settingsChanged", { key, oldValue, newValue: value });

    console.log(`Setting updated: ${key} = ${value}`);
  }

  /**
   * Get all settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Update multiple settings at once
   */
  updateSettings(newSettings) {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Auto-save if enabled
    if (this.settings.autoSaveSettings) {
      this.saveSettings();
    }

    // Notify listeners
    this.notifyListeners("settingsChanged", {
      oldSettings,
      newSettings: this.settings,
    });

    console.log("Multiple settings updated:", newSettings);
  }

  /**
   * Reset settings to default values
   */
  resetToDefaults() {
    const defaultSettings = {
      defaultCrawlLocation: "",
      extensionToken: "",
      autoSaveSettings: true,
      showNotifications: true,
      debugMode: false,
    };

    const oldSettings = { ...this.settings };
    this.settings = defaultSettings;

    this.saveSettings();
    this.notifyListeners("settingsReset", {
      oldSettings,
      newSettings: this.settings,
    });

    console.log("Settings reset to defaults");
  }

  /**
   * Validate Extension Token
   */
  async validateExtensionToken(token = null) {
    const tokenToValidate = token || this.settings.extensionToken;

    if (!tokenToValidate) {
      return { valid: false, error: "Token is empty" };
    }

    try {
      // TODO: Implement actual token validation with extension
      // For now, simulate validation
      await this.delay(1000);

      // Mock validation logic
      if (tokenToValidate.length >= 8) {
        return { valid: true, message: "Token is valid" };
      } else {
        return { valid: false, error: "Token must be at least 8 characters" };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generate a new random token
   */
  generateNewToken() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";

    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
  }

  /**
   * Validate folder path
   */
  async validateFolderPath(path) {
    if (!path) {
      return { valid: false, error: "Path is empty" };
    }

    try {
      // TODO: Implement actual folder validation with file system
      // For now, simulate validation
      await this.delay(500);

      // Basic path validation
      if (path.length > 0 && !path.includes("<") && !path.includes(">")) {
        return { valid: true, message: "Path is valid" };
      } else {
        return { valid: false, error: "Invalid path format" };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Add event listener for settings changes
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in settings listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Export settings to JSON file
   */
  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = "zalo-crawler-settings.json";
    link.click();

    console.log("Settings exported");
  }

  /**
   * Import settings from JSON file
   */
  async importSettings(file) {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);

      // Validate imported settings
      const validKeys = Object.keys(this.settings);
      const filteredSettings = {};

      for (const key of validKeys) {
        if (importedSettings.hasOwnProperty(key)) {
          filteredSettings[key] = importedSettings[key];
        }
      }

      this.updateSettings(filteredSettings);
      console.log("Settings imported:", filteredSettings);

      return { success: true, imported: filteredSettings };
    } catch (error) {
      console.error("Error importing settings:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get settings summary for display
   */
  getSettingsSummary() {
    return {
      hasDefaultLocation: !!this.settings.defaultCrawlLocation,
      hasExtensionToken: !!this.settings.extensionToken,
      autoSaveEnabled: this.settings.autoSaveSettings,
      notificationsEnabled: this.settings.showNotifications,
      debugModeEnabled: this.settings.debugMode,
      totalSettings: Object.keys(this.settings).length,
    };
  }

  /**
   * Utility delay method
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create global instance
window.settingsManager = new SettingsManager();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = SettingsManager;
}
