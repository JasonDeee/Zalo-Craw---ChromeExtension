/**
 * Welcome Component - Landing screen with mode selection and token input
 * Handles navigation to different app modes and extension token management
 */
class Welcome extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      extensionToken: "",
      tokenStatus: "disconnected", // 'disconnected', 'connecting', 'connected', 'error'
      isValidating: false,
    };

    // Load saved token from storage
    this.loadSavedToken();
  }

  /**
   * Component mount lifecycle
   */
  async mount() {
    console.log("Welcome component mounted");

    // Initialize token input value
    this.updateTokenInput();

    // Update token status display
    this.updateTokenStatus();

    // Focus on token input if empty
    const tokenInput = this.$("#extensionToken");
    if (tokenInput && !this.state.extensionToken) {
      setTimeout(() => tokenInput.focus(), 100);
    }
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

    // Navigation buttons
    const pairedModeBtn = this.$("#pairedModeBtn");
    const dependenceModeBtn = this.$("#dependenceModeBtn");
    const settingsBtn = this.$("#settingsBtn");
    const aboutBtn = this.$("#aboutBtn");

    if (pairedModeBtn)
      this.addEventListener(pairedModeBtn, "click", this.handlePairedMode);
    if (dependenceModeBtn)
      this.addEventListener(
        dependenceModeBtn,
        "click",
        this.handleDependenceMode
      );
    if (settingsBtn)
      this.addEventListener(settingsBtn, "click", this.handleSettings);
    if (aboutBtn) this.addEventListener(aboutBtn, "click", this.handleAbout);

    // Token input events
    const tokenInput = this.$("#extensionToken");
    if (tokenInput) {
      this.addEventListener(tokenInput, "input", this.handleTokenInput);
      this.addEventListener(tokenInput, "blur", this.handleTokenBlur);
      this.addEventListener(tokenInput, "keypress", this.handleTokenKeypress);
    }
  }

  /**
   * Handle token input changes
   */
  handleTokenInput = (event) => {
    const token = event.target.value.trim();
    this.setState({ extensionToken: token });

    // Save to global settings
    window.settingsManager.set("extensionToken", token);

    // Update status
    this.updateTokenStatus();
  };

  /**
   * Handle token input blur (validation)
   */
  handleTokenBlur = () => {
    if (this.state.extensionToken) {
      this.validateToken();
    }
  };

  /**
   * Handle Enter key in token input
   */
  handleTokenKeypress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.state.extensionToken) {
        this.validateToken();
      }
    }
  };

  /**
   * Navigate to Paired Mode (requires valid token)
   */
  handlePairedMode = () => {
    if (!this.state.extensionToken) {
      this.showTokenError(
        "Vui lòng nhập Extension Token để sử dụng chế độ kết nối"
      );
      return;
    }

    // TODO: Validate token with extension before navigation
    console.log(
      "Navigating to Paired Mode with token:",
      this.state.extensionToken
    );
    this.navigate("/paired-mode", { token: this.state.extensionToken });
  };

  /**
   * Navigate to Dependence Mode (standalone)
   */
  handleDependenceMode = () => {
    console.log("Navigating to Dependence Mode");
    this.navigate("/dependence-mode");
  };

  /**
   * Navigate to Settings
   */
  handleSettings = () => {
    console.log("Navigating to Settings");
    this.navigate("/settings");
  };

  /**
   * Navigate to About
   */
  handleAbout = () => {
    console.log("Navigating to About");
    this.navigate("/about");
  };

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
   * Load saved token from global settings
   */
  loadSavedToken() {
    const savedToken = window.settingsManager.get("extensionToken");
    if (savedToken) {
      this.setState({ extensionToken: savedToken });
    }
  }

  /**
   * Update token input field value
   */
  updateTokenInput() {
    const tokenInput = this.$("#extensionToken");
    if (tokenInput) {
      tokenInput.value = this.state.extensionToken;
    }
  }

  /**
   * Update token status display
   */
  updateTokenStatus() {
    const statusIndicator = this.$(".status-indicator");
    const statusText = this.$(".status-text");

    if (!statusIndicator || !statusText) return;

    // Remove all status classes
    statusIndicator.className = "status-indicator";

    switch (this.state.tokenStatus) {
      case "connected":
        statusIndicator.classList.add("status-connected");
        statusText.textContent = "Đã kết nối";
        break;
      case "connecting":
        statusIndicator.classList.add("status-connecting");
        statusText.textContent = "Đang kết nối...";
        break;
      case "error":
        statusIndicator.classList.add("status-error");
        statusText.textContent = "Lỗi kết nối";
        break;
      default:
        statusIndicator.classList.add("status-disconnected");
        statusText.textContent = this.state.extensionToken
          ? "Chưa xác thực"
          : "Chưa kết nối";
    }
  }

  /**
   * Validate extension token
   */
  async validateToken() {
    if (this.state.isValidating) return;

    this.setState({
      isValidating: true,
      tokenStatus: "connecting",
    });

    this.updateTokenStatus();

    try {
      // TODO: Implement actual token validation with extension
      // For now, simulate validation
      await this.delay(1000);

      // Mock validation logic
      if (this.state.extensionToken.length >= 8) {
        this.setState({ tokenStatus: "connected" });
        console.log("Token validated successfully");
      } else {
        this.setState({ tokenStatus: "error" });
        this.showTokenError("Token không hợp lệ. Vui lòng kiểm tra lại.");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      this.setState({ tokenStatus: "error" });
      this.showTokenError("Không thể xác thực token. Vui lòng thử lại.");
    } finally {
      this.setState({ isValidating: false });
      this.updateTokenStatus();
    }
  }

  /**
   * Show token error message
   */
  showTokenError(message) {
    // Create temporary error message
    const tokenWrapper = this.$(".token-input-wrapper");
    if (!tokenWrapper) return;

    // Remove existing error
    const existingError = tokenWrapper.querySelector(".token-error");
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorElement = document.createElement("div");
    errorElement.className = "token-error";
    errorElement.textContent = message;

    tokenWrapper.appendChild(errorElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);
  }

  /**
   * Handle state changes
   */
  onStateChange(oldState, newState) {
    // Update UI when state changes
    if (oldState.tokenStatus !== newState.tokenStatus) {
      this.updateTokenStatus();
    }
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
    console.log("Welcome component unmounted");
    // Additional cleanup if needed
  }
}
