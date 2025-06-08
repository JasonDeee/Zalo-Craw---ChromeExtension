class PairedMode extends BaseComponent {
  constructor() {
    super();
    this.extensionStatus = "Chưa kết nối";
    this.lastMessage = "Chưa có tin nhắn nào";
    this.messageCount = 0;
  }

  setTemplatePath() {
    this.templatePath = null; // Inline template
  }

  async loadTemplate() {
    this.element = document.createElement("div");
    this.element.className = "paired-mode-component component";
    return "";
  }

  async mount() {
    this.element.innerHTML = `
      <div class="paired-mode-container">
        <div class="paired-mode-header">
          <div class="paired-mode-title">
            <h1>🔗 Paired Mode</h1>
            <p class="subtitle">Kết nối với Chrome Extension</p>
          </div>
          <div class="window-controls">
            <button class="window-btn minimize-btn" id="minimizeBtn">−</button>
            <button class="window-btn maximize-btn" id="maximizeBtn">□</button>
            <button class="window-btn close-btn" id="closeBtn">×</button>
          </div>
        </div>

        <div class="paired-mode-content">
          <div class="connection-status">
            <div class="status-indicator">
              <div class="status-dot" id="statusDot"></div>
              <span id="statusText">${this.extensionStatus}</span>
            </div>
          </div>

          <div class="message-display">
            <h3>📨 Tin nhắn từ Extension:</h3>
            <div class="message-box">
              <p id="messageContent">${this.lastMessage}</p>
              <div class="message-meta">
                <small>Số tin nhắn đã nhận: <span id="messageCount">${this.messageCount}</span></small>
                <small id="lastUpdate">Chưa cập nhật</small>
              </div>
            </div>
          </div>

          <div class="test-section">
            <h3>🧪 Test Native Messaging:</h3>
            <div class="test-buttons">
              <button class="test-btn" id="testConnectionBtn">Test Kết Nối</button>
              <button class="test-btn" id="clearMessagesBtn">Xóa Tin Nhắn</button>
            </div>
          </div>
        </div>

        <div class="paired-mode-footer">
          <button class="nav-btn secondary" id="backToWelcomeBtn">
            ← Quay lại Welcome
          </button>
          <button class="nav-btn secondary" id="goToSettingsBtn">
            Cài đặt →
          </button>
        </div>
      </div>
    `;

    // Bind methods to component instance
    const testConnectionBtn = this.element.querySelector("#testConnectionBtn");
    const clearMessagesBtn = this.element.querySelector("#clearMessagesBtn");

    if (testConnectionBtn) {
      testConnectionBtn.addEventListener("click", () => {
        this.testConnection();
      });
    }

    if (clearMessagesBtn) {
      clearMessagesBtn.addEventListener("click", () => {
        this.clearMessages();
      });
    }

    // Bind navigation buttons
    const backToWelcomeBtn = this.element.querySelector("#backToWelcomeBtn");
    const goToSettingsBtn = this.element.querySelector("#goToSettingsBtn");

    if (backToWelcomeBtn) {
      backToWelcomeBtn.addEventListener("click", () => {
        if (window.router) {
          window.router.navigate("/welcome");
        }
      });
    }

    if (goToSettingsBtn) {
      goToSettingsBtn.addEventListener("click", () => {
        if (window.router) {
          window.router.navigate("/settings");
        }
      });
    }

    // Bind window controls
    const minimizeBtn = this.element.querySelector("#minimizeBtn");
    const maximizeBtn = this.element.querySelector("#maximizeBtn");
    const closeBtn = this.element.querySelector("#closeBtn");

    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", () => {
        if (window.electronAPI && window.electronAPI.minimize) {
          window.electronAPI.minimize();
        }
      });
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener("click", () => {
        if (window.electronAPI && window.electronAPI.maximize) {
          window.electronAPI.maximize();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (window.electronAPI && window.electronAPI.close) {
          window.electronAPI.close();
        }
      });
    }

    // Start listening for native messages
    this.startNativeMessageListener();

    // Update initial status
    this.updateStatus();
  }

  async unmount() {
    // Stop listening for messages when component unmounts
    if (this.messageListener) {
      // Remove any active listeners
      this.messageListener = null;
    }
    await super.unmount();
  }

  startNativeMessageListener() {
    // Listen for messages from main process (Electron)
    if (window.electronAPI && window.electronAPI.onNativeMessage) {
      window.electronAPI.onNativeMessage((message) => {
        console.log("Received native message:", message);
        this.handleNativeMessage(message);
      });
    }

    // Also listen for direct IPC messages
    if (window.electronAPI && window.electronAPI.onExtensionMessage) {
      window.electronAPI.onExtensionMessage((data) => {
        console.log("Received extension message:", data);
        this.handleExtensionMessage(data);
      });
    }
  }

  handleNativeMessage(message) {
    this.messageCount++;
    this.lastMessage = JSON.stringify(message, null, 2);
    this.extensionStatus = "Đã kết nối - Nhận tin nhắn";

    this.updateDisplay();
  }

  handleExtensionMessage(data) {
    this.messageCount++;
    this.lastMessage =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    this.extensionStatus = "Đã kết nối - Extension hoạt động";

    this.updateDisplay();
  }

  updateDisplay() {
    const messageContent = this.element.querySelector("#messageContent");
    const messageCount = this.element.querySelector("#messageCount");
    const lastUpdate = this.element.querySelector("#lastUpdate");

    if (messageContent) {
      messageContent.textContent = this.lastMessage;
    }

    if (messageCount) {
      messageCount.textContent = this.messageCount;
    }

    if (lastUpdate) {
      lastUpdate.textContent = `Cập nhật lúc: ${new Date().toLocaleTimeString()}`;
    }

    this.updateStatus();
  }

  updateStatus() {
    const statusText = this.element.querySelector("#statusText");
    const statusDot = this.element.querySelector("#statusDot");

    if (statusText) {
      statusText.textContent = this.extensionStatus;
    }

    if (statusDot) {
      // Update status dot color based on connection status
      statusDot.className = "status-dot";
      if (this.extensionStatus.includes("Đã kết nối")) {
        statusDot.classList.add("connected");
      } else if (this.extensionStatus.includes("Đang kết nối")) {
        statusDot.classList.add("connecting");
      } else {
        statusDot.classList.add("disconnected");
      }
    }
  }

  testConnection() {
    this.extensionStatus = "Đang test kết nối...";
    this.updateStatus();

    // Send test message to main process
    if (window.electronAPI && window.electronAPI.sendToExtension) {
      window.electronAPI.sendToExtension({
        action: "TEST_CONNECTION",
        timestamp: Date.now(),
        message: "Test từ Electron App",
      });
    }

    // Simulate response after 2 seconds if no real response
    setTimeout(() => {
      if (this.extensionStatus.includes("Đang test")) {
        this.extensionStatus = "Test hoàn thành - Chưa nhận phản hồi";
        this.updateStatus();
      }
    }, 2000);
  }

  clearMessages() {
    this.messageCount = 0;
    this.lastMessage = "Đã xóa tất cả tin nhắn";
    this.extensionStatus = "Chờ tin nhắn mới";
    this.updateDisplay();
  }
}
