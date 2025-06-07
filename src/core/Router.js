/**
 * Router Class - Manages route navigation with animations
 * Supports mounting/unmounting transitions between components
 */
class Router {
  constructor(appContainer = ".CrawlerApp") {
    this.appContainer = document.querySelector(appContainer);
    this.currentComponent = null;
    this.routes = new Map();
    this.transitionDuration = 300; // Configurable transition duration
    this.isTransitioning = false;

    // Initialize router
    this.init();
  }

  /**
   * Initialize router and setup event listeners
   */
  init() {
    // Listen for hash changes
    window.addEventListener("hashchange", () => this.handleRouteChange());
    window.addEventListener("load", () => this.handleRouteChange());

    // Ensure app container exists
    if (!this.appContainer) {
      console.error(
        "App container not found. Make sure .CrawlerApp exists in DOM"
      );
      return;
    }

    console.log("Router initialized successfully");
  }

  /**
   * Register a route with its component class
   * @param {string} path - Route path (e.g., '/welcome')
   * @param {Class} ComponentClass - Component class to render
   */
  register(path, ComponentClass) {
    this.routes.set(path, ComponentClass);
    console.log(`Route registered: ${path}`);
  }

  /**
   * Navigate to a specific route with animation
   * @param {string} path - Target route path
   * @param {Object} params - Optional parameters to pass to component
   */
  async navigate(path, params = {}) {
    if (this.isTransitioning) {
      console.warn("Navigation blocked: transition in progress");
      return;
    }

    const ComponentClass = this.routes.get(path);
    if (!ComponentClass) {
      console.error(`Route not found: ${path}`);
      return;
    }

    this.isTransitioning = true;

    try {
      // Update URL hash
      window.location.hash = path;

      // Create new component instance
      const newComponent = new ComponentClass(params);
      await newComponent.loadTemplate();

      // Start transition animation
      await this.performTransition(newComponent);

      // Update current component reference
      this.currentComponent = newComponent;

      console.log(`Navigated to: ${path}`);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Perform the mounting/unmounting transition animation
   * @param {Object} newComponent - New component to mount
   */
  async performTransition(newComponent) {
    const currentElement = this.currentComponent?.element;
    const newElement = newComponent.element;

    // Add mounting class to new component
    newElement.classList.add("mounting");

    // Mount new component to DOM
    this.appContainer.appendChild(newElement);

    // Start unmounting current component if exists
    if (currentElement) {
      currentElement.classList.add("unmounting");
    }

    // Wait for CSS transition to complete
    await this.delay(this.transitionDuration);

    // Cleanup old component
    if (this.currentComponent) {
      await this.currentComponent.unmount();
    }

    // Remove mounting class from new component
    newElement.classList.remove("mounting");

    // Call onMount lifecycle
    await newComponent.onMount();
  }

  /**
   * Handle route changes from hash changes
   */
  async handleRouteChange() {
    const hash = window.location.hash.slice(1) || "/welcome"; // Default to welcome
    await this.navigate(hash);
  }

  /**
   * Get current route path
   * @returns {string} Current route path
   */
  getCurrentRoute() {
    return window.location.hash.slice(1) || "/welcome";
  }

  /**
   * Set transition duration
   * @param {number} duration - Duration in milliseconds
   */
  setTransitionDuration(duration) {
    this.transitionDuration = duration;
    console.log(`Transition duration set to: ${duration}ms`);
  }

  /**
   * Check if router is currently transitioning
   * @returns {boolean} Transition status
   */
  isNavigating() {
    return this.isTransitioning;
  }

  /**
   * Utility method to create delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Go back to previous route (if available)
   */
  goBack() {
    window.history.back();
  }

  /**
   * Replace current route without adding to history
   * @param {string} path - Target route path
   * @param {Object} params - Optional parameters
   */
  async replace(path, params = {}) {
    // Use replaceState to avoid adding to history
    window.history.replaceState(null, null, `#${path}`);
    await this.navigate(path, params);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Router;
} else {
  window.Router = Router;
}
