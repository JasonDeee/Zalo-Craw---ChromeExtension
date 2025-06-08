/**
 * Settings Component - Application settings management
 * Uses inline template for better performance and maintainability
 */
class Settings extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      defaultCrawlLocation: "",
      extensionToken: "",
      autoSave: true,
      showNotifications: true,
      debugMode: false,
    };

    // Load current settings
    this.loadCurrentSettings();
  }

  /**
   * Override template loading to use inline HTML
   */
  setTemplatePath() {
    this.templatePath = null; // No external template file
  }

  async loadTemplate() {
    // Create element with inline HTML template
    this.element = document.createElement("div");
    this.element.className = "settings-component component";
    this.element.innerHTML = `
      <div class="settings-container">
        <!-- Main content -->
        <div class="main-content">
          <div class="content-wrapper">
            <h1>⚙️ Cài đặt ứng dụng</h1>

            <!-- Default Crawl Location -->
            <div class="setting-group">
              <h3>📁 Thư mục mặc định</h3>
              <div class="form-group">
                <label for="defaultCrawlLocation">Đường dẫn thư mục chứa hình ảnh:</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    id="defaultCrawlLocation"
                    placeholder="Chọn thư mục mặc định để lưu hình ảnh..."
                    readonly
                  />
                  <button id="browseDefaultLocationBtn" class="browse-btn">Chọn thư mục</button>
                </div>
              </div>
            </div>

            <!-- Extension Token -->
            <div class="setting-group">
              <h3>🔑 Extension Token</h3>
              <div class="form-group">
                <label for="globalExtensionToken">Token kết nối với Extension:</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    id="globalExtensionToken"
                    placeholder="Nhập Extension Token..."
                  />
                  <button id="validateTokenBtn" class="validate-btn">Xác thực</button>
                  <button id="clearTokenBtn" class="clear-btn">Xóa</button>
                  <button id="generateTokenBtn" class="generate-btn">Tạo mới</button>
                </div>
                <div class="token-status">
                  <span class="status-indicator"></span>
                  <span class="status-text">Chưa xác thực</span>
                </div>
              </div>
            </div>

            <!-- Advanced Settings -->
            <div class="setting-group">
              <h3>🔧 Cài đặt nâng cao</h3>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="autoSave" checked>
                  <span class="checkmark"></span>
                  Tự động lưu cài đặt
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="showNotifications" checked>
                  <span class="checkmark"></span>
                  Hiển thị thông báo
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="debugMode">
                  <span class="checkmark"></span>
                  Chế độ debug
                </label>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button id="saveSettingsBtn" class="btn primary">💾 Lưu cài đặt</button>
              <button id="resetSettingsBtn" class="btn secondary">🔄 Khôi phục mặc định</button>
            </div>

            <!-- Status Message -->
            <div id="statusMessage" class="status-message" style="display: none;"></div>
          </div>

          <!-- Navigation footer -->
          <div class="navigation-footer">
            <button class="nav-btn back-btn" id="backToWelcome">
              ← Quay lại Welcome
            </button>
            <button class="nav-btn about-btn" id="openAbout">ℹ️ Giới thiệu</button>
          </div>
        </div>
      </div>
    `;

    return "";
  }

  /**
   * Component mount lifecycle
   */
  async mount() {
    console.log("Settings component mounted");

    // Load settings into form
    this.updateFormValues();

    // Update token status
    this.updateTokenStatus();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Browse folder button
    const browseBtn = this.$("#browseDefaultLocationBtn");
    if (browseBtn)
      this.addEventListener(browseBtn, "click", this.handleBrowseFolder);

    // Token buttons
    const validateBtn = this.$("#validateTokenBtn");
    const clearBtn = this.$("#clearTokenBtn");
    const generateBtn = this.$("#generateTokenBtn");

    if (validateBtn)
      this.addEventListener(validateBtn, "click", this.handleValidateToken);
    if (clearBtn)
      this.addEventListener(clearBtn, "click", this.handleClearToken);
    if (generateBtn)
      this.addEventListener(generateBtn, "click", this.handleGenerateToken);

    // Token input
    const tokenInput = this.$("#globalExtensionToken");
    if (tokenInput)
      this.addEventListener(tokenInput, "input", this.handleTokenInput);

    // Checkboxes
    const autoSaveCheckbox = this.$("#autoSave");
    const notificationsCheckbox = this.$("#showNotifications");
    const debugCheckbox = this.$("#debugMode");

    if (autoSaveCheckbox)
      this.addEventListener(
        autoSaveCheckbox,
        "change",
        this.handleAutoSaveChange
      );
    if (notificationsCheckbox)
      this.addEventListener(
        notificationsCheckbox,
        "change",
        this.handleNotificationsChange
      );
    if (debugCheckbox)
      this.addEventListener(debugCheckbox, "change", this.handleDebugChange);

    // Action buttons
    const saveBtn = this.$("#saveSettingsBtn");
    const resetBtn = this.$("#resetSettingsBtn");

    if (saveBtn)
      this.addEventListener(saveBtn, "click", this.handleSaveSettings);
    if (resetBtn)
      this.addEventListener(resetBtn, "click", this.handleResetSettings);

    // Navigation buttons
    const backBtn = this.$("#backToWelcome");
    const aboutBtn = this.$("#openAbout");

    if (backBtn)
      this.addEventListener(backBtn, "click", this.handleBackToWelcome);
    if (aboutBtn)
      this.addEventListener(aboutBtn, "click", this.handleOpenAbout);
  }

  /**
   * Handle browse folder
   */
  handleBrowseFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectFolder) {
        const result = await window.electronAPI.selectFolder();

        if (
          !result.canceled &&
          result.filePaths &&
          result.filePaths.length > 0
        ) {
          const folderPath = result.filePaths[0];
          this.setState({ defaultCrawlLocation: folderPath });

          // Update global settings
          if (window.settingsManager) {
            window.settingsManager.set("defaultCrawlLocation", folderPath);
          }

          // Update form
          const input = this.$("#defaultCrawlLocation");
          if (input) input.value = folderPath;

          this.showStatus("Đã cập nhật thư mục mặc định", "success");
        }
      } else {
        this.showStatus("Electron API không khả dụng", "error");
      }
    } catch (error) {
      this.showStatus("Lỗi khi chọn thư mục: " + error.message, "error");
    }
  };

  /**
   * Handle token input
   */
  handleTokenInput = (event) => {
    const token = event.target.value.trim();
    this.setState({ extensionToken: token });

    // Update global settings
    if (window.settingsManager) {
      window.settingsManager.set("extensionToken", token);
    }

    this.updateTokenStatus();
  };

  /**
   * Handle validate token
   */
  handleValidateToken = async () => {
    const token = this.state.extensionToken;
    if (!token) {
      this.showStatus("Vui lòng nhập token trước khi xác thực", "error");
      return;
    }

    this.showStatus("Đang xác thực token...", "info");

    // Simulate validation
    await this.delay(1000);

    if (token.length >= 8) {
      this.showStatus("Token hợp lệ!", "success");
    } else {
      this.showStatus("Token không hợp lệ", "error");
    }
  };

  /**
   * Handle clear token
   */
  handleClearToken = () => {
    this.setState({ extensionToken: "" });

    if (window.settingsManager) {
      window.settingsManager.set("extensionToken", "");
    }

    const input = this.$("#globalExtensionToken");
    if (input) input.value = "";

    this.updateTokenStatus();
    this.showStatus("Đã xóa token", "info");
  };

  /**
   * Handle generate token
   */
  handleGenerateToken = () => {
    if (window.settingsManager) {
      const newToken = window.settingsManager.generateNewToken();
      this.setState({ extensionToken: newToken });

      const input = this.$("#globalExtensionToken");
      if (input) input.value = newToken;

      this.updateTokenStatus();
      this.showStatus("Đã tạo token mới", "success");
    }
  };

  /**
   * Handle checkbox changes
   */
  handleAutoSaveChange = (event) => {
    this.setState({ autoSave: event.target.checked });
  };

  handleNotificationsChange = (event) => {
    this.setState({ showNotifications: event.target.checked });
  };

  handleDebugChange = (event) => {
    this.setState({ debugMode: event.target.checked });
  };

  /**
   * Handle save settings
   */
  handleSaveSettings = () => {
    // Save all settings to global manager
    if (window.settingsManager) {
      window.settingsManager.set(
        "defaultCrawlLocation",
        this.state.defaultCrawlLocation
      );
      window.settingsManager.set("extensionToken", this.state.extensionToken);
      window.settingsManager.set("autoSave", this.state.autoSave);
      window.settingsManager.set(
        "showNotifications",
        this.state.showNotifications
      );
      window.settingsManager.set("debugMode", this.state.debugMode);
    }

    this.showStatus("Đã lưu cài đặt thành công!", "success");
  };

  /**
   * Handle reset settings
   */
  handleResetSettings = () => {
    if (confirm("Bạn có chắc muốn khôi phục cài đặt mặc định?")) {
      // Reset to defaults
      this.setState({
        defaultCrawlLocation: "",
        extensionToken: "",
        autoSave: true,
        showNotifications: true,
        debugMode: false,
      });

      // Update global settings
      if (window.settingsManager) {
        window.settingsManager.resetToDefaults();
      }

      // Update form
      this.updateFormValues();
      this.updateTokenStatus();

      this.showStatus("Đã khôi phục cài đặt mặc định", "info");
    }
  };

  /**
   * Navigation handlers
   */
  handleBackToWelcome = () => {
    this.navigate("/welcome");
  };

  handleOpenAbout = () => {
    this.navigate("/about");
  };

  /**
   * Load current settings from global manager
   */
  loadCurrentSettings() {
    if (window.settingsManager) {
      this.setState({
        defaultCrawlLocation:
          window.settingsManager.get("defaultCrawlLocation") || "",
        extensionToken: window.settingsManager.get("extensionToken") || "",
        autoSave: window.settingsManager.get("autoSave") !== false,
        showNotifications:
          window.settingsManager.get("showNotifications") !== false,
        debugMode: window.settingsManager.get("debugMode") === true,
      });
    }
  }

  /**
   * Update form values from state
   */
  updateFormValues() {
    const defaultLocationInput = this.$("#defaultCrawlLocation");
    const tokenInput = this.$("#globalExtensionToken");
    const autoSaveCheckbox = this.$("#autoSave");
    const notificationsCheckbox = this.$("#showNotifications");
    const debugCheckbox = this.$("#debugMode");

    if (defaultLocationInput)
      defaultLocationInput.value = this.state.defaultCrawlLocation;
    if (tokenInput) tokenInput.value = this.state.extensionToken;
    if (autoSaveCheckbox) autoSaveCheckbox.checked = this.state.autoSave;
    if (notificationsCheckbox)
      notificationsCheckbox.checked = this.state.showNotifications;
    if (debugCheckbox) debugCheckbox.checked = this.state.debugMode;
  }

  /**
   * Update token status display
   */
  updateTokenStatus() {
    const statusIndicator = this.$(".status-indicator");
    const statusText = this.$(".status-text");

    if (!statusIndicator || !statusText) return;

    statusIndicator.className = "status-indicator";

    if (this.state.extensionToken) {
      statusIndicator.classList.add("status-connected");
      statusText.textContent = "Token đã nhập";
    } else {
      statusIndicator.classList.add("status-disconnected");
      statusText.textContent = "Chưa có token";
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type) {
    const statusElement = this.$("#statusMessage");
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = "block";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 3000);
  }

  /**
   * Utility delay method
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Component cleanup
   */
  async unmount() {
    console.log("Settings component unmounted");
  }
}
