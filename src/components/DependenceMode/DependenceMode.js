/**
 * DependenceMode Component - Standalone image organization mode
 * Migrated from main.js functionality for organizing images from JSON data
 */
class DependenceMode extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      folderPath: "",
      jsonData: "",
      isProcessing: false,
      lastResult: null,
    };

    // Load saved data
    this.loadSavedData();
  }

  /**
   * Component mount lifecycle
   */
  async mount() {
    console.log("DependenceMode component mounted");

    // Load default crawl location from global settings
    this.loadDefaultCrawlLocation();

    // Initialize form values
    this.updateFormValues();

    // Show read-only mode indicator
    this.showModeIndicator();
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

    // Form elements
    const browseFolderBtn = this.$("#browseFolderBtn");
    const processBtn = this.$("#processBtn");
    const folderPathInput = this.$("#folderPath");
    const jsonDataTextarea = this.$("#jsonData");

    if (browseFolderBtn)
      this.addEventListener(browseFolderBtn, "click", this.handleBrowseFolder);
    if (processBtn)
      this.addEventListener(processBtn, "click", this.handleProcess);
    if (folderPathInput)
      this.addEventListener(
        folderPathInput,
        "input",
        this.handleFolderPathChange
      );
    if (jsonDataTextarea)
      this.addEventListener(
        jsonDataTextarea,
        "input",
        this.handleJsonDataChange
      );

    // Navigation buttons
    const backToWelcomeBtn = this.$("#backToWelcome");
    const openSettingsBtn = this.$("#openSettings");

    if (backToWelcomeBtn)
      this.addEventListener(
        backToWelcomeBtn,
        "click",
        this.handleBackToWelcome
      );
    if (openSettingsBtn)
      this.addEventListener(openSettingsBtn, "click", this.handleOpenSettings);
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
   * Handle browse folder button click
   */
  handleBrowseFolder = async () => {
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
          this.setState({ folderPath });

          const folderPathInput = this.$("#folderPath");
          if (folderPathInput) {
            folderPathInput.value = folderPath;
          }

          // Save to localStorage
          localStorage.setItem("zalo-crawler-last-folder", folderPath);
        }
      }
    } catch (error) {
      this.showStatus("Lỗi khi chọn thư mục: " + error.message, "error");
    }
  };

  /**
   * Handle folder path input change
   */
  handleFolderPathChange = (event) => {
    const folderPath = event.target.value.trim();
    this.setState({ folderPath });

    if (folderPath) {
      localStorage.setItem("zalo-crawler-last-folder", folderPath);
    }
  };

  /**
   * Handle JSON data textarea change
   */
  handleJsonDataChange = (event) => {
    const jsonData = event.target.value.trim();
    this.setState({ jsonData });

    if (jsonData) {
      localStorage.setItem("zalo-crawler-last-json", jsonData);
    }
  };

  /**
   * Handle process button click
   */
  handleProcess = async () => {
    const { folderPath, jsonData } = this.state;

    if (!folderPath) {
      return this.showStatus(
        "Vui lòng nhập đường dẫn thư mục chứa hình ảnh",
        "error"
      );
    }

    if (!jsonData) {
      return this.showStatus("Vui lòng nhập dữ liệu JSON", "error");
    }

    try {
      // Parse JSON data
      const data = JSON.parse(jsonData);

      // Validate JSON structure
      if (!data.clients || !Array.isArray(data.clients)) {
        return this.showStatus(
          'Dữ liệu JSON không đúng định dạng. Cần có mảng "clients".',
          "error"
        );
      }

      // Start processing
      this.setState({ isProcessing: true });
      this.updateProcessButton(true);
      this.showStatus("Đang xử lý...", "success");

      // Call main process to organize images
      if (typeof require !== "undefined") {
        const { ipcRenderer } = require("electron");
        const result = await ipcRenderer.invoke("organize-images", {
          folderPath,
          clients: data.clients,
        });

        if (result.success) {
          this.setState({ lastResult: result });
          this.showStatus(
            `Đã xử lý thành công! Đã tạo ${result.createdFolders.length} thư mục và di chuyển ${result.movedFiles} file.`,
            "success"
          );

          // Display folder list
          this.displayFolderList(result.createdFolders);
        } else {
          this.showStatus(`Lỗi: ${result.error}`, "error");
        }
      }
    } catch (error) {
      this.showStatus(`Lỗi khi xử lý: ${error.message}`, "error");
    } finally {
      this.setState({ isProcessing: false });
      this.updateProcessButton(false);
    }
  };

  /**
   * Handle back to welcome navigation
   */
  handleBackToWelcome = () => {
    this.navigate("/welcome");
  };

  /**
   * Handle open settings navigation
   */
  handleOpenSettings = () => {
    this.navigate("/settings");
  };

  /**
   * Show status message
   */
  showStatus(message, type) {
    const statusElement = this.$("#statusMessage");
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = "status " + type;
    statusElement.style.display = "block";
  }

  /**
   * Update process button state
   */
  updateProcessButton(isProcessing) {
    const processBtn = this.$("#processBtn");
    if (!processBtn) return;

    processBtn.disabled = isProcessing;
    processBtn.textContent = isProcessing
      ? "Đang xử lý..."
      : "Xử lý và tổ chức hình ảnh";
  }

  /**
   * Display folder list
   */
  displayFolderList(folders) {
    const folderList = this.$("#folderList");
    const folderItems = this.$("#folderItems");

    if (!folderList || !folderItems) return;

    folderItems.innerHTML = "";

    folders.forEach((folder) => {
      const folderItem = document.createElement("div");
      folderItem.className = "folder-item";
      folderItem.textContent = folder;
      folderItems.appendChild(folderItem);
    });

    folderList.style.display = "block";
  }

  /**
   * Load default crawl location from global settings
   */
  loadDefaultCrawlLocation() {
    try {
      const defaultLocation = window.settingsManager.get(
        "defaultCrawlLocation"
      );
      if (defaultLocation && !this.state.folderPath) {
        this.setState({ folderPath: defaultLocation });
      }
    } catch (error) {
      console.error("Error loading default crawl location:", error);
    }
  }

  /**
   * Load saved data from localStorage
   */
  loadSavedData() {
    const savedFolder = localStorage.getItem("zalo-crawler-last-folder");
    const savedJson = localStorage.getItem("zalo-crawler-last-json");

    // Only use saved folder if no default location is set
    if (savedFolder && !this.state.folderPath) {
      this.setState({ folderPath: savedFolder });
    }

    if (savedJson) {
      this.setState({ jsonData: savedJson });
    }
  }

  /**
   * Update form values from state
   */
  updateFormValues() {
    const folderPathInput = this.$("#folderPath");
    const jsonDataTextarea = this.$("#jsonData");

    if (folderPathInput) {
      folderPathInput.value = this.state.folderPath;
    }

    if (jsonDataTextarea) {
      jsonDataTextarea.value = this.state.jsonData;
    }
  }

  /**
   * Show read-only mode indicator
   */
  showModeIndicator() {
    const contentWrapper = this.$(".content-wrapper");
    if (!contentWrapper) return;

    // Check if indicator already exists
    if (contentWrapper.querySelector(".read-only-indicator")) return;

    const indicator = document.createElement("div");
    indicator.className = "read-only-indicator";
    indicator.textContent = "Chế độ độc lập - Standalone Mode";

    contentWrapper.insertBefore(indicator, contentWrapper.firstChild);
  }

  /**
   * Component cleanup
   */
  async unmount() {
    console.log("DependenceMode component unmounted");
    // Additional cleanup if needed
  }
}
