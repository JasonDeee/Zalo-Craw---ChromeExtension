/**
 * Settings Component - Application settings management
 * Handles Default Crawl Location, Extension Token, and other global settings
 */
class Settings extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      isLoading: false,
      isSaving: false,
      isValidatingToken: false,
      lastSaveTime: null,
      hasUnsavedChanges: false,
    };

    // Bind settings manager events
    this.bindSettingsEvents();
  }

  /**
   * Component mount lifecycle
   */
  async mount() {
    console.log("Settings component mounted");

    // Load current settings into form
    this.loadSettingsIntoForm();

    // Update UI state
    this.updateTokenStatus();
    this.updateSaveButtonState();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Window control buttons
    const minimizeBtn = this.$(".window-control.minimize");
    const maximizeBtn = this.$(".window-control.maximize");
    const closeBtn = this.$(".window-control.close");

    if (minimizeBtn)
      this.addEventListener(minimizeBtn, "click", this.minimizeWindow);
    if (maximizeBtn)
      this.addEventListener(maximizeBtn, "click", this.maximizeWindow);
    if (closeBtn) this.addEventListener(closeBtn, "click", this.closeWindow);

    // Default Crawl Location
    const browseDefaultLocationBtn = this.$("#browseDefaultLocationBtn");

    if (browseDefaultLocationBtn) {
      this.addEventListener(
        browseDefaultLocationBtn,
        "click",
        this.handleBrowseDefaultLocation
      );
    }

    // Extension Token
    const globalExtensionTokenInput = this.$("#globalExtensionToken");
    const validateTokenBtn = this.$("#validateTokenBtn");
    const clearTokenBtn = this.$("#clearTokenBtn");
    const generateTokenBtn = this.$("#generateTokenBtn");

    if (globalExtensionTokenInput) {
      this.addEventListener(
        globalExtensionTokenInput,
        "input",
        this.handleTokenInput
      );
      this.addEventListener(
        globalExtensionTokenInput,
        "blur",
        this.handleTokenBlur
      );
    }
    if (validateTokenBtn)
      this.addEventListener(
        validateTokenBtn,
        "click",
        this.handleValidateToken
      );
    if (clearTokenBtn)
      this.addEventListener(clearTokenBtn, "click", this.handleClearToken);
    if (generateTokenBtn)
      this.addEventListener(
        generateTokenBtn,
        "click",
        this.handleGenerateToken
      );

    // Advanced Settings Checkboxes
    const autoSaveCheckbox = this.$("#autoSaveSettings");
    const showNotificationsCheckbox = this.$("#showNotifications");
    const debugModeCheckbox = this.$("#debugMode");

    if (autoSaveCheckbox)
      this.addEventListener(
        autoSaveCheckbox,
        "change",
        this.handleAutoSaveChange
      );
    if (showNotificationsCheckbox)
      this.addEventListener(
        showNotificationsCheckbox,
        "change",
        this.handleNotificationsChange
      );
    if (debugModeCheckbox)
      this.addEventListener(
        debugModeCheckbox,
        "change",
        this.handleDebugModeChange
      );

    // Action Buttons
    const resetSettingsBtn = this.$("#resetSettingsBtn");
    const saveSettingsBtn = this.$("#saveSettingsBtn");

    if (resetSettingsBtn)
      this.addEventListener(
        resetSettingsBtn,
        "click",
        this.handleResetSettings
      );
    if (saveSettingsBtn)
      this.addEventListener(saveSettingsBtn, "click", this.handleSaveSettings);

    // Navigation buttons
    const backToWelcomeBtn = this.$("#backToWelcome");
    const openAboutBtn = this.$("#openAbout");

    if (backToWelcomeBtn)
      this.addEventListener(
        backToWelcomeBtn,
        "click",
        this.handleBackToWelcome
      );
    if (openAboutBtn)
      this.addEventListener(openAboutBtn, "click", this.handleOpenAbout);
  }

  /**
   * Bind settings manager events
   */
  bindSettingsEvents() {
    if (window.settingsManager) {
      window.settingsManager.addEventListener(
        "settingsChanged",
        this.onSettingsChanged
      );
      window.settingsManager.addEventListener(
        "settingsSaved",
        this.onSettingsSaved
      );
      window.settingsManager.addEventListener(
        "settingsReset",
        this.onSettingsReset
      );
    }
  }

  /**
   * Window control methods
   */
  minimizeWindow = () => {
    if (typeof require !== "undefined") {
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-minimize");
    }
  };

  maximizeWindow = () => {
    if (typeof require !== "undefined") {
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-maximize");
    }
  };

  closeWindow = () => {
    if (typeof require !== "undefined") {
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-close");
    }
  };

  /**
   * Handle browse default location
   */
  handleBrowseDefaultLocation = async () => {
    try {
      if (typeof require !== "undefined") {
        const { ipcRenderer } = require("electron");
        const result = await ipcRenderer.invoke("select-folder");

        if (
          !result.canceled &&
          result.filePaths &&
          result.filePaths.length > 0
        ) {
          const folderPath = result.filePaths[0];

          // Update input field
          const input = this.$("#defaultCrawlLocation");
          if (input) {
            input.value = folderPath;
          }

          // Update global settings
          window.settingsManager.set("defaultCrawlLocation", folderPath);

          this.setState({ hasUnsavedChanges: true });
          this.updateSaveButtonState();

          this.showStatusMessage("Đã chọn thư mục mặc định", "success");
        }
      }
    } catch (error) {
      this.showStatusMessage("Lỗi khi chọn thư mục: " + error.message, "error");
    }
  };

  /**
   * Handle token input changes
   */
  handleTokenInput = (event) => {
    const token = event.target.value.trim();
    window.settingsManager.set("extensionToken", token);

    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
    this.updateTokenStatus();
  };

  /**
   * Handle token input blur
   */
  handleTokenBlur = () => {
    const token = window.settingsManager.get("extensionToken");
    if (token) {
      this.validateToken(token);
    }
  };

  /**
   * Handle validate token button
   */
  handleValidateToken = async () => {
    const token = window.settingsManager.get("extensionToken");
    if (!token) {
      this.showStatusMessage("Vui lòng nhập Extension Token", "error");
      return;
    }

    await this.validateToken(token);
  };

  /**
   * Handle clear token button
   */
  handleClearToken = () => {
    window.settingsManager.set("extensionToken", "");

    const input = this.$("#globalExtensionToken");
    if (input) {
      input.value = "";
    }

    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
    this.updateTokenStatus();

    this.showStatusMessage("Đã xóa Extension Token", "success");
  };

  /**
   * Handle generate token button
   */
  handleGenerateToken = () => {
    const newToken = window.settingsManager.generateNewToken();
    window.settingsManager.set("extensionToken", newToken);

    const input = this.$("#globalExtensionToken");
    if (input) {
      input.value = newToken;
    }

    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
    this.updateTokenStatus();

    this.showStatusMessage("Đã tạo Extension Token mới", "success");
  };

  /**
   * Handle advanced settings changes
   */
  handleAutoSaveChange = (event) => {
    window.settingsManager.set("autoSaveSettings", event.target.checked);
    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
  };

  handleNotificationsChange = (event) => {
    window.settingsManager.set("showNotifications", event.target.checked);
    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
  };

  handleDebugModeChange = (event) => {
    window.settingsManager.set("debugMode", event.target.checked);
    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
  };

  /**
   * Handle reset settings
   */
  handleResetSettings = async () => {
    const confirmed = confirm(
      "Bạn có chắc chắn muốn khôi phục tất cả cài đặt về mặc định?"
    );
    if (!confirmed) return;

    try {
      window.settingsManager.resetToDefaults();
      this.loadSettingsIntoForm();
      this.setState({ hasUnsavedChanges: false });
      this.updateSaveButtonState();
      this.updateTokenStatus();

      this.showStatusMessage("Đã khôi phục cài đặt mặc định", "success");
    } catch (error) {
      this.showStatusMessage(
        "Lỗi khi khôi phục cài đặt: " + error.message,
        "error"
      );
    }
  };

  /**
   * Handle save settings
   */
  handleSaveSettings = async () => {
    this.setState({ isSaving: true });
    this.updateSaveButtonState();

    try {
      const success = window.settingsManager.saveSettings();

      if (success) {
        this.setState({
          hasUnsavedChanges: false,
          lastSaveTime: new Date(),
        });
        this.showStatusMessage("Đã lưu cài đặt thành công", "success");
      } else {
        this.showStatusMessage("Lỗi khi lưu cài đặt", "error");
      }
    } catch (error) {
      this.showStatusMessage("Lỗi khi lưu cài đặt: " + error.message, "error");
    } finally {
      this.setState({ isSaving: false });
      this.updateSaveButtonState();
    }
  };

  /**
   * Handle navigation
   */
  handleBackToWelcome = () => {
    if (this.state.hasUnsavedChanges) {
      const confirmed = confirm(
        "Bạn có thay đổi chưa lưu. Bạn có muốn tiếp tục?"
      );
      if (!confirmed) return;
    }

    this.navigate("/welcome");
  };

  handleOpenAbout = () => {
    this.navigate("/about");
  };

  /**
   * Validate token
   */
  async validateToken(token) {
    this.setState({ isValidatingToken: true });
    this.updateTokenStatus();

    try {
      const result = await window.settingsManager.validateExtensionToken(token);

      if (result.valid) {
        this.showStatusMessage("Token hợp lệ", "success");
      } else {
        this.showStatusMessage("Token không hợp lệ: " + result.error, "error");
      }
    } catch (error) {
      this.showStatusMessage(
        "Lỗi khi kiểm tra token: " + error.message,
        "error"
      );
    } finally {
      this.setState({ isValidatingToken: false });
      this.updateTokenStatus();
    }
  }

  /**
   * Load settings into form
   */
  loadSettingsIntoForm() {
    const settings = window.settingsManager.getAll();

    // Default Crawl Location
    const defaultLocationInput = this.$("#defaultCrawlLocation");
    if (defaultLocationInput) {
      defaultLocationInput.value = settings.defaultCrawlLocation || "";
    }

    // Extension Token
    const tokenInput = this.$("#globalExtensionToken");
    if (tokenInput) {
      tokenInput.value = settings.extensionToken || "";
    }

    // Advanced Settings
    const autoSaveCheckbox = this.$("#autoSaveSettings");
    if (autoSaveCheckbox) {
      autoSaveCheckbox.checked = settings.autoSaveSettings;
    }

    const notificationsCheckbox = this.$("#showNotifications");
    if (notificationsCheckbox) {
      notificationsCheckbox.checked = settings.showNotifications;
    }

    const debugCheckbox = this.$("#debugMode");
    if (debugCheckbox) {
      debugCheckbox.checked = settings.debugMode;
    }
  }

  /**
   * Update token status display
   */
  updateTokenStatus() {
    const statusIndicator = this.$(".status-indicator");
    const statusText = this.$(".status-text");

    if (!statusIndicator || !statusText) return;

    const token = window.settingsManager.get("extensionToken");

    // Remove all status classes
    statusIndicator.className = "status-indicator";

    if (this.state.isValidatingToken) {
      statusIndicator.classList.add("status-connecting");
      statusText.textContent = "Đang kiểm tra...";
    } else if (!token) {
      statusIndicator.classList.add("status-disconnected");
      statusText.textContent = "Chưa có token";
    } else if (token.length >= 8) {
      statusIndicator.classList.add("status-connected");
      statusText.textContent = "Token đã nhập";
    } else {
      statusIndicator.classList.add("status-error");
      statusText.textContent = "Token không hợp lệ";
    }
  }

  /**
   * Update save button state
   */
  updateSaveButtonState() {
    const saveBtn = this.$("#saveSettingsBtn");
    if (!saveBtn) return;

    if (this.state.isSaving) {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Đang lưu...";
    } else if (this.state.hasUnsavedChanges) {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Lưu cài đặt";
      saveBtn.classList.add("has-changes");
    } else {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Lưu cài đặt";
      saveBtn.classList.remove("has-changes");
    }
  }

  /**
   * Show status message
   */
  showStatusMessage(message, type) {
    const statusElement = this.$("#settingsStatusMessage");
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = "status-message " + type;
    statusElement.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (statusElement.style.display === "block") {
        statusElement.style.display = "none";
      }
    }, 5000);
  }

  /**
   * Settings manager event handlers
   */
  onSettingsChanged = (data) => {
    console.log("Settings changed:", data);
    this.setState({ hasUnsavedChanges: true });
    this.updateSaveButtonState();
  };

  onSettingsSaved = (settings) => {
    console.log("Settings saved:", settings);
    this.setState({
      hasUnsavedChanges: false,
      lastSaveTime: new Date(),
    });
    this.updateSaveButtonState();
  };

  onSettingsReset = (data) => {
    console.log("Settings reset:", data);
    this.loadSettingsIntoForm();
    this.setState({ hasUnsavedChanges: false });
    this.updateSaveButtonState();
    this.updateTokenStatus();
  };

  /**
   * Component cleanup
   */
  async unmount() {
    console.log("Settings component unmounted");

    // Remove settings manager event listeners
    if (window.settingsManager) {
      window.settingsManager.removeEventListener(
        "settingsChanged",
        this.onSettingsChanged
      );
      window.settingsManager.removeEventListener(
        "settingsSaved",
        this.onSettingsSaved
      );
      window.settingsManager.removeEventListener(
        "settingsReset",
        this.onSettingsReset
      );
    }
  }
}
