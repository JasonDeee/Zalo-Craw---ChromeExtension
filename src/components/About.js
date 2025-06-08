class About extends BaseComponent {
  constructor() {
    super();
    this.setTemplatePath();
  }

  setTemplatePath() {
    // About component sử dụng inline template
    this.templatePath = null;
  }

  async loadTemplate() {
    // Tạo element container
    this.element = document.createElement("div");
    this.element.className = "about-component component";

    // Return inline template
    return `
      <div class="about-container">
        <div class="about-header">
          <button class="back-button" data-action="back">
            <i class="icon-arrow-left"></i>
            <span>Quay lại</span>
          </button>
          <h1 class="about-title">About Zalo Crawler</h1>
        </div>

        <div class="about-content">
          <div class="about-info">
            <p class="about-description">
              <!-- TODO: Thêm thông tin về ứng dụng -->
            </p>
          </div>

          <div class="about-version">
            <div class="version-info">
              <span class="version-label">Version:</span>
              <span class="version-number">1.0.0 [Ohio Ver]</span>
            </div>
          </div>
        </div>

        <footer class="about-footer">
          <!-- TODO: Thêm nút cập nhật app -->
        </footer>
      </div>
    `;
  }

  async mount() {
    try {
      // Load and set template
      const template = await this.loadTemplate();
      this.element.innerHTML = template;

      // Bind events
      this.bindEvents();

      console.log("About component mounted successfully");
    } catch (error) {
      console.error("Error mounting About component:", error);
      this.element.innerHTML = `
        <div class="error-container">
          <h2>⚠️ Lỗi tải component</h2>
          <p>Không thể tải About component: ${error.message}</p>
          <button onclick="router.navigate('/welcome')">Quay lại Welcome</button>
        </div>
      `;
    }
  }

  bindEvents() {
    // Back button
    const backButton = this.element.querySelector('[data-action="back"]');
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.handleBack();
      });
    }
  }

  handleBack() {
    // Navigate back to welcome screen
    if (window.router) {
      window.router.navigate("/welcome");
    }
  }

  unmount() {
    // Clean up any specific About component resources
    console.log("About component unmounted");
    super.unmount();
  }
}
