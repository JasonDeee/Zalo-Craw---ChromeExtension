/**
 * Welcome Component - Landing screen with mode selection and token input
 * Uses inline template for better performance and maintainability
 */
class Welcome extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      extensionToken: "",
      tokenStatus: "disconnected",
      isValidating: false,
    };

    // Load saved token from storage
    this.loadSavedToken();
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
    this.element.className = "welcome-component component";
    this.element.innerHTML = `<div class="welcome-container">
  <!-- Logo section -->
  <header class="logo-section">
    <div class="logo-wrapper">
      <div class="logo">
        <div
          class="logo-icon"
          style="
            background-image: url(./src/Assets/Vx_ZaloCrawler-LogoMark-White.svg);
          "
        ></div>
        <div class="logo-text">
          <h1 class="logo-title">Zalo<br />Crawler</h1>
          <span class="version-tag">[Ohio Ver.]</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main content section -->
  <main class="main-content">
    <!-- Token section -->
    <div class="token-section">
      <div class="token-input-wrapper">
        <label class="token-label">
          <input
            type="text"
            id="extensionToken"
            class="token-input"
            placeholder="Nhập Extension Token để kết nối..."
            autocomplete="off"
        /></label>

        <button id="pairedModeBtn" class="btn btn-primary light_sweep-effect">
          <span class="btn-icon"></span>
          <span class="btn-text">Khởi tạo.</span>
        </button>
      </div>
    </div>

    <!-- Buttons section -->
    <div class="buttons-section">
      Hoặc tiếp tục với&nbsp;
      <button id="dependenceModeBtn" class="btn btn-straytext">
        Chế độ độc lập
      </button>
    </div>

    <!-- Footer text -->
    <p class="footer-text">
      * Chế độ độc lập: Mọi chức năng hoạt động bình thường.<br />
      Người dùng cần sao chép JSON thủ công từ Phần mở rộng<br />
      của Zalo Crawler trong trình duyệt.
    </p>
  </main>

  <!-- Footer section -->
  <footer class="footer-section">
    <div class="device-info">
      <!-- Navigation link - Settings only -->
      <div class="navigation-links">
        <button id="settingsBtn" class="nav-btn--with-icon settings-btn">
          <span class="btn-icon"></span>
          <span class="btn-text">Thiết lập.</span>
        </button>
      </div>
      <div class="line--vertical"></div>
      <span class="device-details">Desktop MB5430</span>
    </div>
  </footer>
</div>
`;

    return "";
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
    // Navigation buttons
    const pairedModeBtn = this.$("#pairedModeBtn");
    const dependenceModeBtn = this.$("#dependenceModeBtn");
    const settingsBtn = this.$("#settingsBtn");

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
    if (window.settingsManager) {
      window.settingsManager.set("extensionToken", token);
    }

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
   * Load saved token from global settings
   */
  loadSavedToken() {
    if (window.settingsManager) {
      const savedToken = window.settingsManager.get("extensionToken");
      if (savedToken) {
        this.setState({ extensionToken: savedToken });
      }
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
      // Simulate validation
      await this.delay(1000);

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
  }
}
