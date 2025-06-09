/**
 * DependenceMode Component - Standalone image organization mode
 * Uses inline template with embedded HTML for better performance
 */
class DependenceMode extends BaseComponent {
  constructor(props = {}) {
    super(props);

    this.state = {
      folderPath: "",
      jsonData: "",
      isProcessing: false,
      lastResult: null,
      // Preview state management
      previewState: "idle", // idle, loading, success, error, processing
      previewData: null,
      expandedFolders: new Set(),
      thumbnailCache: new Map(),
    };

    // Preview management
    this.previewTimeout = null;
    this.cancelPreviewOperation = null;

    // Load saved data
    this.loadSavedData();
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
    this.element.className = "dependence-mode-component component";
    this.element.innerHTML = `<div class="dependence-mode-container">
  <style>
    .CrawlerApp::before {
      background-position: bottom right;
    }
    @media screen and (max-width: 1333px) {
      .CrawlerApp::before {
        background-size: calc(100vh - 160px) calc(100vh - 160px);
      }
    }
    @media screen and (min-width: 1334px) {
      .CrawlerApp::before {
        background-size: calc(100vh - 128px) calc(100vh - 128px);
      }
    }
  </style>
  <script src="https://cdn.lordicon.com/lordicon.js"></script>
  <!-- Main content -->
  <div class="main-content">
    <header class="main-header">
      <button class="nav-btn--with-icon return-btn" id="backToWelcome">
        <span class="btn-icon"></span>
        <span class="btn-text">Quay lại.</span>
      </button>
      <h1>Chế độ độc lập.<span>[StandAlone.]</span></h1>
    </header>
    <main class="content-wrapper">
      <div class="form-group" id="jsonDataGroup">
        <label for="jsonData">Dữ liệu JSON đầu vào.</label>
        <textarea
          id="jsonData"
          placeholder='Dán dữ liệu JSON từ extension vào đây.
          Ví dụ:
{
  "clients": [
    {
      "text": "Tên khách hàng 1",
      "image_names": ["image1.jpg", "image2.jpg"]
    },
    {
      "text": "Tên khách hàng 2", 
      "image_names": ["image3.jpg"]
    }
  ]
}'
        ></textarea>
        <div class="btn-group">
          <button id="processBtn" class="btn btn-primary light_sweep-effect">
            <span class="btn-icon"></span>
            <span class="btn-text">Chuyển đổi</span>
          </button>
        </div>
      </div>
      <div class="form-group" id="folderGroupPreview">
        <label for="folderPath"
          ><input type="text" id="folderPath" placeholder="Nhập đường dẫn..." />
          <button id="browseFolderBtn" class="browse-btn btn btn-straytext">
            Chọn thư mục
          </button></label
        >
        <div id="folderList" class="folder-list">
          <div id="folderItems"></div>
        </div>
      </div>
    </main>

    <!-- Navigation footer -->
    <footer class="navigation-footer">
      <div id="statusMessage" class="status">Sẵn sàng.</div>
    </footer>
  </div>
</div>
`;

    return "";
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
    // Form elements
    const browseFolderBtn = this.$("#browseFolderBtn");
    const processBtn = this.$("#processBtn");
    const folderPathInput = this.$("#folderPath");
    const jsonDataTextarea = this.$("#jsonData");

    if (browseFolderBtn)
      this.addEventListener(browseFolderBtn, "click", this.handleBrowseFolder);
    if (processBtn)
      this.addEventListener(processBtn, "click", this.handleProcess);
    if (folderPathInput) {
      this.addEventListener(
        folderPathInput,
        "input",
        this.handleFolderPathChange
      );
      this.addEventListener(folderPathInput, "blur", this.handleFolderPathBlur);
    }
    if (jsonDataTextarea) {
      this.addEventListener(
        jsonDataTextarea,
        "input",
        this.handleJsonDataChange
      );
      this.addEventListener(jsonDataTextarea, "blur", this.handleJsonDataBlur);
    }

    // Navigation buttons
    const backToWelcomeBtn = this.$("#backToWelcome");

    if (backToWelcomeBtn)
      this.addEventListener(
        backToWelcomeBtn,
        "click",
        this.handleBackToWelcome
      );
  }

  /**
   * Handle browse folder button click
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
          this.setState({ folderPath });

          const folderPathInput = this.$("#folderPath");
          if (folderPathInput) {
            folderPathInput.value = folderPath;
          }

          // Save to localStorage
          localStorage.setItem("zalo-crawler-last-folder", folderPath);
        }
      } else {
        this.showStatus("Electron API không khả dụng", "error");
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
   * Handle folder path input blur
   */
  handleFolderPathBlur = (event) => {
    const folderPath = event.target.value.trim();
    this.setState({ folderPath });

    if (folderPath) {
      localStorage.setItem("zalo-crawler-last-folder", folderPath);
      // Trigger preview if we have both folderPath and jsonData
      this.triggerPreview();
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
   * Handle JSON data textarea blur
   */
  handleJsonDataBlur = (event) => {
    const jsonData = event.target.value.trim();
    this.setState({ jsonData });

    if (jsonData) {
      localStorage.setItem("zalo-crawler-last-json", jsonData);
      // Trigger preview if we have both folderPath and jsonData
      this.triggerPreview();
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
      this.setState({ isProcessing: true, previewState: "processing" });
      this.updateProcessButton(true);
      this.showStatus("Đang xử lý...", "success");

      // Clear any pending preview operations
      this.clearPreviewTimeout();

      // Call main process to organize images
      if (window.electronAPI && window.electronAPI.organizeImages) {
        const result = await window.electronAPI.organizeImages({
          folderPath,
          clients: data.clients,
        });

        if (result.success) {
          this.setState({ lastResult: result });
          this.showStatus(
            `Đã xử lý thành công! Đã tạo ${result.createdFolders.length} thư mục và di chuyển ${result.movedFiles} file.`,
            "success"
          );

          // After successful processing, trigger preview
          await this.performPreview();
        } else {
          this.showStatus(`Lỗi: ${result.error}`, "error");
          // Set error state and show error spinner
          this.setState({ previewState: "error" });
          this.showPreviewError(result.error);
        }
      } else {
        this.showStatus("Electron API không khả dụng", "error");
        this.setState({ previewState: "error" });
        this.showPreviewError("Electron API không khả dụng");
      }
    } catch (error) {
      this.showStatus(`Lỗi khi xử lý: ${error.message}`, "error");
      this.setState({ previewState: "error" });
      this.showPreviewError(error.message);
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
   * Trigger preview with debounce and validation
   */
  triggerPreview = () => {
    const { folderPath, jsonData, previewState } = this.state;

    // Don't trigger preview if currently processing
    if (previewState === "processing") return;

    // Check if we have both required data
    if (!folderPath || !jsonData) return;

    // Clear any existing timeout
    this.clearPreviewTimeout();

    // Reset error state if in error
    if (previewState === "error") {
      this.setState({ previewState: "idle" });
      this.clearErrorDisplay();
    }

    // Set loading state and show spinner
    this.setState({ previewState: "loading" });
    this.showPreviewSpinner("Đang quét thư mục...");

    // Debounce 500ms
    this.previewTimeout = setTimeout(() => {
      this.performPreview();
    }, 500);
  };

  /**
   * Clear preview timeout
   */
  clearPreviewTimeout = () => {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }

    if (this.cancelPreviewOperation) {
      this.cancelPreviewOperation();
      this.cancelPreviewOperation = null;
    }
  };

  /**
   * Perform the actual preview operation
   */
  performPreview = async () => {
    const { folderPath, jsonData } = this.state;

    try {
      // Update spinner status
      this.showPreviewSpinner("Đang phân tích dữ liệu JSON...");

      // Parse JSON data
      const data = JSON.parse(jsonData);

      // Validate JSON structure
      if (!data.clients || !Array.isArray(data.clients)) {
        throw new Error(
          'Dữ liệu JSON không đúng định dạng. Cần có mảng "clients".'
        );
      }

      // Update spinner status
      this.showPreviewSpinner("Đang quét file trong thư mục...");

      // Get files from folder via Electron API
      let availableFiles = [];
      if (window.electronAPI && window.electronAPI.scanFolder) {
        availableFiles = await window.electronAPI.scanFolder(folderPath);
      } else {
        throw new Error("Electron API không khả dụng");
      }

      // Update spinner status
      this.showPreviewSpinner("Đang sắp xếp dữ liệu...");

      // Build preview data
      const previewData = await this.buildPreviewData(
        data.clients,
        availableFiles,
        folderPath
      );

      // Set success state and render preview
      this.setState({
        previewState: "success",
        previewData,
        expandedFolders: new Set([0]), // Expand first folder by default
      });

      this.renderPreview();
    } catch (error) {
      console.error("Preview error:", error);
      this.setState({ previewState: "error" });
      this.showPreviewError(error.message);
    }
  };

  /**
   * Build preview data structure
   */
  buildPreviewData = async (clients, availableFiles, folderPath) => {
    const previewData = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const folderName = await this.formatFolderName(client.text);

      const clientData = {
        id: i,
        name: client.text,
        folderName: folderName,
        files: [],
        imageCount: 0,
        videoCount: 0,
        missingCount: 0,
      };

      if (client.image_names && Array.isArray(client.image_names)) {
        for (const imageName of client.image_names) {
          const isAvailable = availableFiles.includes(imageName);
          const fileExt = imageName.split(".").pop().toLowerCase();
          const isVideo = [
            "mp4",
            "avi",
            "mov",
            "wmv",
            "flv",
            "webm",
            "mkv",
          ].includes(fileExt);

          // Create proper file path
          const fullPath = isAvailable
            ? `${folderPath}${
                folderPath.endsWith("/") || folderPath.endsWith("\\") ? "" : "/"
              }${imageName}`
            : null;

          clientData.files.push({
            name: imageName,
            isAvailable,
            isVideo,
            path: fullPath,
          });

          if (isAvailable) {
            if (isVideo) {
              clientData.videoCount++;
            } else {
              clientData.imageCount++;
            }
          } else {
            clientData.missingCount++;
          }
        }
      }

      previewData.push(clientData);
    }

    return previewData;
  };

  /**
   * Format folder name using Electron API
   */
  formatFolderName = async (text) => {
    if (window.electronAPI && window.electronAPI.formatFolderName) {
      return await window.electronAPI.formatFolderName(text);
    }
    return text; // Fallback
  };

  /**
   * Show preview spinner with status text
   */
  showPreviewSpinner = (statusText) => {
    const folderList = this.$("#folderList");
    if (!folderList) return;

    folderList.innerHTML = `
      <div class="preview-loading" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px;">
        <lord-icon
          src="https://cdn.lordicon.com/cliaeomg.json"
          trigger="loop"
          delay="50"
          colors="primary:#ffffff"
          style="width:64px;height:64px">
        </lord-icon>
        <div class="loading-text" style="color: var(--WhiteColor); font-size: 0.9rem; text-align: center; opacity: 0.8;">
          ${statusText}
        </div>
      </div>
    `;
    folderList.style.display = "block";
  };

  /**
   * Show preview error with error icon
   */
  showPreviewError = (errorMessage) => {
    const folderList = this.$("#folderList");
    const folderGroupPreview = this.$("#folderGroupPreview");

    if (!folderList || !folderGroupPreview) return;

    // Add error class
    folderGroupPreview.classList.add("ErrorDisplay");

    folderList.innerHTML = `
      <div class="preview-error" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px;">
        <lord-icon
          src="https://cdn.lordicon.com/yfxqzclt.json"
          trigger="in"
          delay="50"
          state="in-error"
          colors="primary:#ffffff"
          style="width:64px;height:64px">
        </lord-icon>
        <div class="error-text" style="color: var(--DarkerAccentColor); font-size: 0.9rem; text-align: center;">
          ${errorMessage}
        </div>
      </div>
    `;
    folderList.style.display = "block";
  };

  /**
   * Clear error display
   */
  clearErrorDisplay = () => {
    const folderGroupPreview = this.$("#folderGroupPreview");
    if (folderGroupPreview) {
      folderGroupPreview.classList.remove("ErrorDisplay");
      folderGroupPreview.classList.remove("DataValid");
    }
  };

  /**
   * Render preview accordion
   */
  renderPreview = () => {
    const { previewData, expandedFolders } = this.state;
    const folderList = this.$("#folderList");

    if (!folderList || !previewData) return;

    let html = `<div class="accordion-container">`;
    // '<h3>Xem trước tổ chức thư mục:</h3>';

    previewData.forEach((clientData) => {
      const isExpanded = expandedFolders.has(clientData.id);
      const totalFiles = clientData.files.length;
      const availableFiles = clientData.imageCount + clientData.videoCount;

      html += `
        <div class="accordion-item ${
          isExpanded ? "expanded" : ""
        }" data-folder-id="${clientData.id}">
          <div class="accordion-header" onclick="window.dependenceModeInstance.toggleFolder(${
            clientData.id
          })">
            <div class="folder-info">
              <div class="folder-name">${clientData.folderName}</div>
              <div class="folder-stats">
                📁 ${availableFiles}/${totalFiles} files
                ${
                  clientData.imageCount > 0 ? `🖼️ ${clientData.imageCount}` : ""
                }
                ${
                  clientData.videoCount > 0 ? `🎥 ${clientData.videoCount}` : ""
                }
                ${
                  clientData.missingCount > 0
                    ? `❌ ${clientData.missingCount}`
                    : ""
                }
              </div>
            </div>
            <div class="accordion-toggle">${isExpanded ? "▼" : "▶"}</div>
          </div>
          <div class="accordion-content" style="display: ${
            isExpanded ? "block" : "none"
          }">
            ${this.renderFolderContent(clientData)}
          </div>
        </div>
      `;
    });

    html += "</div>";
    folderList.innerHTML = html;
    folderList.style.display = "block";

    // Store instance reference for onclick handlers
    window.dependenceModeInstance = this;

    // Add DataValid class to indicate successful preview
    const folderGroupPreview = this.$("#folderGroupPreview");
    if (folderGroupPreview) {
      folderGroupPreview.classList.add("DataValid");
    }
  };

  /**
   * Render folder content with thumbnails
   */
  renderFolderContent = (clientData) => {
    if (clientData.files.length === 0) {
      return '<div class="no-files">Không có file nào</div>';
    }

    let html = '<div class="file-grid">';

    clientData.files.forEach((file) => {
      if (file.isAvailable) {
        if (file.isVideo) {
          // Video file - show name only
          html += `
            <div class="file-item video-file">
              <div class="video-icon">🎥</div>
              <div class="file-name">${file.name}</div>
            </div>
          `;
        } else {
          // Image file - show thumbnail
          html += `
            <div class="file-item image-file">
              <div class="image-thumbnail" data-path="${file.path}">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjMzMzIiByeD0iOCIvPgo8dGV4dCB4PSI0OCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD4KPHN2Zz4K" alt="Loading..." />
              </div>
              <div class="file-name">${file.name}</div>
            </div>
          `;
        }
      } else {
        // Missing file
        html += `
          <div class="file-item missing-file">
            <div class="missing-icon">❌</div>
            <div class="file-name">${file.name}</div>
          </div>
        `;
      }
    });

    html += "</div>";
    return html;
  };

  /**
   * Toggle folder accordion
   */
  toggleFolder = (folderId) => {
    const { expandedFolders } = this.state;
    const newExpandedFolders = new Set(expandedFolders);

    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }

    this.setState({ expandedFolders: newExpandedFolders });
    this.renderPreview();

    // Load thumbnails for newly expanded folder
    if (newExpandedFolders.has(folderId)) {
      this.loadThumbnailsForFolder(folderId);
    }
  };

  /**
   * Load thumbnails for a specific folder
   */
  loadThumbnailsForFolder = async (folderId) => {
    const { previewData } = this.state;
    const clientData = previewData.find((c) => c.id === folderId);

    if (!clientData) return;

    // Load thumbnails for image files
    for (const file of clientData.files) {
      if (file.isAvailable && !file.isVideo) {
        await this.loadThumbnail(file.path);
      }
    }
  };

  /**
   * Load individual thumbnail
   */
  loadThumbnail = async (imagePath) => {
    const { thumbnailCache } = this.state;

    // Check cache first
    if (thumbnailCache.has(imagePath)) {
      const thumbnailElement = this.$(`[data-path="${imagePath}"] img`);
      if (thumbnailElement) {
        thumbnailElement.src = thumbnailCache.get(imagePath);
      }
      return;
    }

    try {
      // Generate thumbnail via Electron API
      if (window.electronAPI && window.electronAPI.generateThumbnail) {
        const thumbnailDataUrl = await window.electronAPI.generateThumbnail(
          imagePath,
          96,
          96
        );

        // Cache the result
        thumbnailCache.set(imagePath, thumbnailDataUrl);
        this.setState({ thumbnailCache });

        // Update the image element
        const thumbnailElement = this.$(`[data-path="${imagePath}"] img`);
        if (thumbnailElement) {
          thumbnailElement.src = thumbnailDataUrl;
        }
      }
    } catch (error) {
      console.error("Error loading thumbnail:", error);
      // Show error placeholder
      const thumbnailElement = this.$(`[data-path="${imagePath}"] img`);
      if (thumbnailElement) {
        thumbnailElement.src =
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjNjY2IiByeD0iOCIvPgo8dGV4dCB4PSI0OCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+Cjwvc3ZnPgo=";
      }
    }
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

    const btnText = processBtn.querySelector(".btn-text");
    processBtn.disabled = isProcessing;

    if (btnText) {
      btnText.textContent = isProcessing ? "Đang xử lý..." : "Chuyển đổi";
    } else {
      // Fallback cho trường hợp không có .btn-text
      processBtn.textContent = isProcessing ? "Đang xử lý..." : "Chuyển đổi";
    }
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
      if (window.settingsManager) {
        const defaultLocation = window.settingsManager.get(
          "defaultCrawlLocation"
        );
        if (defaultLocation && !this.state.folderPath) {
          this.setState({ folderPath: defaultLocation });
        }
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

    // Clear preview operations
    this.clearPreviewTimeout();

    // Clear instance reference
    if (window.dependenceModeInstance === this) {
      delete window.dependenceModeInstance;
    }

    // Clear thumbnail cache
    if (this.state.thumbnailCache) {
      this.state.thumbnailCache.clear();
    }
  }
}
