/**
 * Main Application Controller
 * Initializes router, registers routes, and manages app lifecycle
 */
class App {
  constructor() {
    this.router = null;
    this.windowControls = null;
    this.isInitialized = false;
    this.components = new Map();

    // Bind methods to preserve context
    this.init = this.init.bind(this);
    this.registerRoutes = this.registerRoutes.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) {
      console.warn("App is already initialized");
      return;
    }

    try {
      console.log("Initializing Zalo Crawler App...");

      // Wait for DOM to be ready
      await this.waitForDOM();

      // Initialize router
      this.initRouter();

      // Initialize window controls
      this.initWindowControls();

      // Register all routes
      this.registerRoutes();

      // Setup global error handling
      this.setupErrorHandling();

      // Setup global event listeners
      this.setupGlobalEvents();

      // Mark as initialized
      this.isInitialized = true;

      console.log("App initialized successfully");

      // Start the application
      await this.start();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Wait for DOM to be ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize the router
   */
  initRouter() {
    this.router = new Router(".CrawlerApp");

    // Make router globally available
    window.router = this.router;

    // Configure transition duration
    this.router.setTransitionDuration(300);

    console.log("Router initialized");
  }

  /**
   * Initialize window controls
   */
  initWindowControls() {
    this.windowControls = new WindowControls();

    // Make window controls globally available
    window.windowControls = this.windowControls;

    console.log("Window controls initialized");
  }

  /**
   * Register all application routes
   */
  registerRoutes() {
    // Import components dynamically when needed
    // For now, we'll register placeholders and implement components later

    // Welcome screen route
    this.router.register("/welcome", WelcomeComponent);

    // Mode selection routes
    this.router.register("/paired-mode", PairedModeComponent);
    this.router.register("/dependence-mode", DependenceModeComponent);

    // Settings and about routes
    this.router.register("/settings", SettingsComponent);
    this.router.register("/about", AboutComponent);

    console.log("Routes registered successfully");
  }

  /**
   * Start the application
   */
  async start() {
    try {
      // Hide the old container
      const oldContainer = document.querySelector(".container");
      if (oldContainer) {
        oldContainer.style.display = "none";
      }

      // Navigate to initial route
      const initialRoute = this.getInitialRoute();
      await this.router.navigate(initialRoute);

      console.log(`App started with route: ${initialRoute}`);
    } catch (error) {
      console.error("Failed to start app:", error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Determine the initial route based on app state
   */
  getInitialRoute() {
    // Always start with Welcome screen for consistent user experience
    // This ensures users always see the main landing page first
    console.log("Setting initial route to Welcome");

    // Mark app as initialized
    localStorage.setItem("zalo-crawler-initialized", "true");

    return "/welcome";
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.handleGlobalError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.handleGlobalError(event.reason);
    });
  }

  /**
   * Setup global event listeners
   */
  setupGlobalEvents() {
    // Save current route on navigation
    window.addEventListener("hashchange", () => {
      const currentRoute = this.router.getCurrentRoute();
      localStorage.setItem("zalo-crawler-last-route", currentRoute);
    });

    // Handle app focus/blur for performance
    window.addEventListener("focus", () => {
      console.log("App focused");
    });

    window.addEventListener("blur", () => {
      console.log("App blurred");
    });
  }

  /**
   * Handle global errors
   */
  handleGlobalError(error) {
    // Log error details
    console.error("Global error handler:", error);

    // Show user-friendly error message
    this.showErrorNotification(
      "An unexpected error occurred. Please try again."
    );

    // Optionally report error to analytics/logging service
    // this.reportError(error);
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(message) {
    // Create error notification element
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--AccentColor);
      color: white;
      padding: 1rem;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Show error screen for critical errors
   */
  showErrorScreen(error) {
    const appContainer = document.querySelector(".CrawlerApp");
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="error-screen">
        <h1>Application Error</h1>
        <p>Sorry, something went wrong. Please restart the application.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.stack || error.message}</pre>
        </details>
        <button onclick="location.reload()">Restart Application</button>
      </div>
    `;
  }

  /**
   * Get router instance
   */
  getRouter() {
    return this.router;
  }

  /**
   * Check if app is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Restart the application
   */
  async restart() {
    console.log("Restarting application...");

    // Reset state
    this.isInitialized = false;
    this.router = null;

    // Clear app container
    const appContainer = document.querySelector(".CrawlerApp");
    if (appContainer) {
      appContainer.innerHTML = "";
    }

    // Re-initialize
    await this.init();
  }

  /**
   * Destroy the application and cleanup resources
   */
  destroy() {
    console.log("Destroying application...");

    // Cleanup router
    if (this.router && this.router.currentComponent) {
      this.router.currentComponent.destroy();
    }

    // Cleanup window controls
    if (this.windowControls) {
      this.windowControls.destroy();
    }

    // Clear global references
    window.router = null;
    window.windowControls = null;

    // Reset state
    this.isInitialized = false;
    this.router = null;
    this.windowControls = null;
    this.components.clear();

    console.log("Application destroyed");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = App;
} else {
  window.App = App;
}

// Note: App initialization is handled in index.html to avoid double initialization
