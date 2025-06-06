// Tạo màn hình mới vào đây

// Welcome Screen Component for Zalo Crawler Desktop App

function createWelcomeScreen() {
  const main = document.createElement("main");
  main.className = "welcome-container";

  // Custom title bar with window controls
  const titleBar = document.createElement("div");
  titleBar.className = "custom-title-bar";

  const windowControls = document.createElement("div");
  windowControls.className = "window-controls";

  const minimizeBtn = document.createElement("button");
  minimizeBtn.className = "window-control minimize";
  minimizeBtn.innerHTML = "−";
  minimizeBtn.addEventListener("click", minimizeWindow);

  const maximizeBtn = document.createElement("button");
  maximizeBtn.className = "window-control maximize";
  maximizeBtn.innerHTML = "□";
  maximizeBtn.addEventListener("click", maximizeWindow);

  const closeBtn = document.createElement("button");
  closeBtn.className = "window-control close";
  closeBtn.innerHTML = "×";
  closeBtn.addEventListener("click", closeWindow);

  windowControls.appendChild(minimizeBtn);
  windowControls.appendChild(maximizeBtn);
  windowControls.appendChild(closeBtn);
  titleBar.appendChild(windowControls);

  // Logo and title section
  const logoSection = document.createElement("div");
  logoSection.className = "logo-section";

  const logoWrapper = document.createElement("div");
  logoWrapper.className = "logo-wrapper";

  const logo = document.createElement("div");
  logo.className = "logo";
  logo.innerHTML = `
        <div class="logo-icon">Z</div>
        <div class="logo-text">
            <span class="logo-title">Zalo</span>
            <span class="logo-subtitle">Crawler.</span>
            <span class="version-tag">[Ohio Ver]</span>
        </div>
    `;

  logoWrapper.appendChild(logo);
  logoSection.appendChild(logoWrapper);

  // Buttons section
  const buttonsSection = document.createElement("div");
  buttonsSection.className = "buttons-section";

  const startButton = document.createElement("button");
  startButton.className = "btn btn-primary start-btn";
  startButton.innerHTML = `
        <span class="btn-icon">🚀</span>
        <span class="btn-text">Khởi tạo.</span>
    `;

  const readOnlyButton = document.createElement("button");
  readOnlyButton.className = "btn btn-secondary readonly-btn";
  readOnlyButton.innerHTML = `
        <span class="btn-text">Chế độ đọc lặp.</span>
    `;

  buttonsSection.appendChild(startButton);
  buttonsSection.appendChild(readOnlyButton);

  // Footer section
  const footerSection = document.createElement("div");
  footerSection.className = "footer-section";

  const footerText = document.createElement("p");
  footerText.className = "footer-text";
  footerText.innerHTML = `
        * Chế độ đọc lặp: Mọi chức năng hoạt động bình thường.<br>
        Người dùng cần sao chép JSON thủ công từ Phần mở rộng<br>
        của Zalo Crawler trong trình duyệt.
    `;

  const deviceInfo = document.createElement("div");
  deviceInfo.className = "device-info";
  deviceInfo.innerHTML = `
        <span class="device-icon">💻</span>
        <span class="device-text">Thiết lập.</span>
        <span class="device-details">Desktop MB5430</span>
    `;

  footerSection.appendChild(footerText);
  footerSection.appendChild(deviceInfo);

  // Assemble the main container
  main.appendChild(titleBar);
  main.appendChild(logoSection);
  main.appendChild(buttonsSection);
  main.appendChild(footerSection);

  // Add event listeners
  startButton.addEventListener("click", handleStartButton);
  readOnlyButton.addEventListener("click", handleReadOnlyButton);

  return main;
}

// Event handlers
function handleStartButton() {
  console.log("Start button clicked - Khởi tạo mode");
  // TODO: Navigate to main application screen
  showMainApplication();
}

function handleReadOnlyButton() {
  console.log("Read-only button clicked - Chế độ đọc lặp");
  // TODO: Navigate to read-only mode
  showMainApplication(true); // Pass true for read-only mode
}

function showMainApplication(readOnlyMode = false) {
  // Hide welcome screen and show main application
  const welcomeContainer = document.querySelector(".welcome-container");
  if (welcomeContainer) {
    welcomeContainer.style.display = "none";
  }

  // Show existing main application content
  const mainContent = document.querySelector(".container");
  if (mainContent) {
    mainContent.style.display = "block";

    // Add title bar to main content if it doesn't exist
    let existingTitleBar = document.querySelector(".custom-title-bar");
    if (
      !existingTitleBar ||
      existingTitleBar.parentElement === welcomeContainer
    ) {
      const mainTitleBar = createMainTitleBar();
      document.body.insertBefore(mainTitleBar, mainContent);
    }

    if (readOnlyMode) {
      // Add read-only mode indicator
      const readOnlyIndicator = document.createElement("div");
      readOnlyIndicator.className = "read-only-indicator";
      readOnlyIndicator.textContent = "Chế độ đọc lặp - Read Only Mode";
      mainContent.insertBefore(readOnlyIndicator, mainContent.firstChild);
    }
  }
}

// Initialize welcome screen
function initWelcomeScreen() {
  // Hide existing content
  const existingContainer = document.querySelector(".container");
  if (existingContainer) {
    existingContainer.style.display = "none";
  }

  // Create and insert welcome screen
  const welcomeScreen = createWelcomeScreen();
  document.body.insertBefore(welcomeScreen, document.body.firstChild);
}

// Create title bar for main application
function createMainTitleBar() {
  const titleBar = document.createElement("div");
  titleBar.className = "custom-title-bar main-title-bar";

  const appTitle = document.createElement("div");
  appTitle.className = "app-title";
  appTitle.textContent = "Zalo Crawler - Desktop Application";

  const windowControls = document.createElement("div");
  windowControls.className = "window-controls";

  const minimizeBtn = document.createElement("button");
  minimizeBtn.className = "window-control minimize";
  minimizeBtn.innerHTML = "−";
  minimizeBtn.addEventListener("click", minimizeWindow);

  const maximizeBtn = document.createElement("button");
  maximizeBtn.className = "window-control maximize";
  maximizeBtn.innerHTML = "□";
  maximizeBtn.addEventListener("click", maximizeWindow);

  const closeBtn = document.createElement("button");
  closeBtn.className = "window-control close";
  closeBtn.innerHTML = "×";
  closeBtn.addEventListener("click", closeWindow);

  windowControls.appendChild(minimizeBtn);
  windowControls.appendChild(maximizeBtn);
  windowControls.appendChild(closeBtn);

  titleBar.appendChild(appTitle);
  titleBar.appendChild(windowControls);

  return titleBar;
}

// Window control functions
function minimizeWindow() {
  if (typeof require !== "undefined") {
    const { remote } = require("electron");
    if (remote && remote.getCurrentWindow) {
      remote.getCurrentWindow().minimize();
    } else {
      // Fallback for newer Electron versions
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-minimize");
    }
  }
}

function maximizeWindow() {
  if (typeof require !== "undefined") {
    const { remote } = require("electron");
    if (remote && remote.getCurrentWindow) {
      const window = remote.getCurrentWindow();
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    } else {
      // Fallback for newer Electron versions
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-maximize");
    }
  }
}

function closeWindow() {
  if (typeof require !== "undefined") {
    const { remote } = require("electron");
    if (remote && remote.getCurrentWindow) {
      remote.getCurrentWindow().close();
    } else {
      // Fallback for newer Electron versions
      const { ipcRenderer } = require("electron");
      ipcRenderer.invoke("window-close");
    }
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { initWelcomeScreen, createWelcomeScreen };
}
