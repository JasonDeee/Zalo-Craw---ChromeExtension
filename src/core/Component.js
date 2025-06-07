/**
 * BaseComponent Class - Foundation for all application components
 * Handles template loading, lifecycle methods, and DOM management
 */
class BaseComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.templatePath = null;
    this.isMounted = false;
    this.eventListeners = [];

    // Set template path based on component name
    this.setTemplatePath();
  }

  /**
   * Set template path based on component class name
   * Override this method in child classes for custom paths
   */
  setTemplatePath() {
    const componentName = this.constructor.name;
    this.templatePath = `src/components/${componentName}/${componentName}.html`;
  }

  /**
   * Load HTML template from file
   * @returns {Promise<string>} Template HTML content
   */
  async loadTemplate() {
    try {
      const response = await fetch(this.templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${this.templatePath}`);
      }

      const templateHTML = await response.text();
      this.createElementFromTemplate(templateHTML);

      console.log(`Template loaded: ${this.templatePath}`);
      return templateHTML;
    } catch (error) {
      console.error("Template loading error:", error);
      // Fallback to empty div if template fails to load
      this.element = document.createElement("div");
      this.element.className = `${this.constructor.name.toLowerCase()}-component component-error`;
      this.element.innerHTML = `<p>Error loading component: ${this.constructor.name}</p>`;
      throw error;
    }
  }

  /**
   * Create DOM element from template HTML
   * @param {string} templateHTML - HTML template content
   */
  createElementFromTemplate(templateHTML) {
    // Create a temporary container
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = templateHTML.trim();

    // Get the first element (should be the component root)
    this.element = tempContainer.firstElementChild;

    if (!this.element) {
      throw new Error("Template must contain at least one root element");
    }

    // Add component class for styling and identification
    this.element.classList.add(
      `${this.constructor.name.toLowerCase()}-component`
    );
    this.element.classList.add("component");

    // Store component reference on element for debugging
    this.element._componentInstance = this;
  }

  /**
   * Lifecycle method - called when component is mounted to DOM
   * Override in child classes for custom mount logic
   */
  async onMount() {
    if (this.isMounted) {
      console.warn(`Component ${this.constructor.name} is already mounted`);
      return;
    }

    this.isMounted = true;

    // Bind event listeners
    this.bindEvents();

    // Call custom mount logic
    await this.mount();

    console.log(`Component mounted: ${this.constructor.name}`);
  }

  /**
   * Lifecycle method - called when component is unmounted from DOM
   * Override in child classes for custom unmount logic
   */
  async onUnmount() {
    if (!this.isMounted) {
      console.warn(`Component ${this.constructor.name} is not mounted`);
      return;
    }

    this.isMounted = false;

    // Remove event listeners
    this.unbindEvents();

    // Call custom unmount logic
    await this.unmount();

    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    console.log(`Component unmounted: ${this.constructor.name}`);
  }

  /**
   * Custom mount logic - override in child classes
   * Called after element is added to DOM and events are bound
   */
  async mount() {
    // Override in child classes
  }

  /**
   * Custom unmount logic - override in child classes
   * Called before element is removed from DOM
   */
  async unmount() {
    // Override in child classes
  }

  /**
   * Bind event listeners - override in child classes
   * Use addEventListener and store references for cleanup
   */
  bindEvents() {
    // Override in child classes
    // Example:
    // const button = this.element.querySelector('.my-button');
    // const handler = () => this.handleClick();
    // button.addEventListener('click', handler);
    // this.eventListeners.push({ element: button, event: 'click', handler });
  }

  /**
   * Remove all event listeners
   */
  unbindEvents() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && handler) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {Element} element - DOM element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   */
  addEventListener(element, event, handler) {
    if (!element || !event || !handler) {
      console.error("Invalid parameters for addEventListener");
      return;
    }

    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  /**
   * Update component state and trigger re-render if needed
   * @param {Object} newState - New state object
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // Call state change handler
    this.onStateChange(oldState, this.state);
  }

  /**
   * Handle state changes - override in child classes
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   */
  onStateChange(oldState, newState) {
    // Override in child classes for reactive updates
  }

  /**
   * Find element within component by selector
   * @param {string} selector - CSS selector
   * @returns {Element|null} Found element or null
   */
  $(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  /**
   * Find all elements within component by selector
   * @param {string} selector - CSS selector
   * @returns {NodeList} Found elements
   */
  $$(selector) {
    return this.element ? this.element.querySelectorAll(selector) : [];
  }

  /**
   * Navigate to another route
   * @param {string} path - Target route path
   * @param {Object} params - Optional parameters
   */
  navigate(path, params = {}) {
    if (window.router) {
      window.router.navigate(path, params);
    } else {
      console.error("Router not available");
    }
  }

  /**
   * Get component name
   * @returns {string} Component class name
   */
  getComponentName() {
    return this.constructor.name;
  }

  /**
   * Check if component is mounted
   * @returns {boolean} Mount status
   */
  isMountedToDOM() {
    return this.isMounted && this.element && document.contains(this.element);
  }

  /**
   * Destroy component and cleanup all resources
   */
  async destroy() {
    if (this.isMounted) {
      await this.onUnmount();
    }

    this.element = null;
    this.props = null;
    this.state = null;
    this.eventListeners = [];
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseComponent;
} else {
  window.BaseComponent = BaseComponent;
}
