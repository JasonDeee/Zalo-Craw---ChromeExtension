/**
 * WindowControls - Manages global window control behaviors
 * Handles minimize, maximize/restore, and close functionality
 */
class WindowControls {
  constructor() {
    this.isMaximized = false;
    this.init();
  }

  /**
   * Initialize window controls
   */
  init() {
    this.bindEvents();
    this.updateMaximizeButton();
  }

  /**
   * Bind event listeners to window control buttons
   */
  bindEvents() {
    // Get buttons
    const minimizeBtn = document.getElementById("MinimizeButton");
    const fullScreenBtn = document.getElementById("FullScreenButton");
    const closeBtn = document.getElementById("CloseButton");

    // Bind events
    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", this.handleMinimize.bind(this));
    }

    if (fullScreenBtn) {
      fullScreenBtn.addEventListener("click", this.handleMaximize.bind(this));
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", this.handleClose.bind(this));
    }

    // Listen for window state changes from main process
    if (window.electronAPI) {
      // Use electronAPI for IPC communication
      window.electronAPI.onWindowMaximized((event, message) => {
        this.isMaximized = true;
        this.updateMaximizeButton();
      });

      window.electronAPI.onWindowUnmaximized(() => {
        this.isMaximized = false;
        this.updateMaximizeButton();
      });
    }
  }

  /**
   * Handle minimize button click
   */
  handleMinimize() {
    console.log("Minimize button clicked");

    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    } else {
      console.error("Electron API không khả dụng");
    }
  }

  /**
   * Handle maximize/restore button click
   */
  handleMaximize() {
    console.log("Maximize/Restore button clicked");

    if (window.electronAPI && window.electronAPI.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    } else {
      console.error("Electron API không khả dụng");
    }
  }

  /**
   * Handle close button click
   */
  handleClose() {
    console.log("Close button clicked");

    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      console.error("Electron API không khả dụng");
    }
  }

  /**
   * Update maximize button icon based on window state
   */
  updateMaximizeButton() {
    const fullScreenBtn = document.getElementById("FullScreenButton");
    if (!fullScreenBtn) return;

    if (this.isMaximized) {
      // Change to restore icon
      fullScreenBtn.style.backgroundImage =
        "url(./src/Assets/Shrink_White_24px.svg)";
      fullScreenBtn.title = "Restore";
    } else {
      // Change to maximize icon
      fullScreenBtn.style.backgroundImage =
        "url(./src/Assets/Fullscreen_White_24px.svg)";
      fullScreenBtn.title = "Maximize";
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    const minimizeBtn = document.getElementById("MinimizeButton");
    const fullScreenBtn = document.getElementById("FullScreenButton");
    const closeBtn = document.getElementById("CloseButton");

    if (minimizeBtn) {
      minimizeBtn.removeEventListener("click", this.handleMinimize);
    }

    if (fullScreenBtn) {
      fullScreenBtn.removeEventListener("click", this.handleMaximize);
    }

    if (closeBtn) {
      closeBtn.removeEventListener("click", this.handleClose);
    }

    // Remove IPC listeners
    if (window.electronAPI && window.electronAPI.removeAllListeners) {
      window.electronAPI.removeAllListeners("window-maximized");
      window.electronAPI.removeAllListeners("window-unmaximized");
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = WindowControls;
}
