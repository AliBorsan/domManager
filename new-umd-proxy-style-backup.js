/**
 * domMan - A lightweight jQuery-like DOM manipulation library
 * Version: 1.0.1
 * Author: Ali Borsan
 * Authors Email: aliborsan@gmail.com
 * Licence: MIT
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.domMan = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var version = "1.0.1";

  // Private data store
  const elementData = new WeakMap();

  var domMan = function (selector) {
    // The domMan object is actually just the init constructor 'enhanced'
    return new domMan.pt.init(selector);
  };

  // ---- Core Functionality  and Prototype----
  /**
   * The domMan object constructor
   * @param {string|Node|NodeList|HTMLCollection} selector - CSS selector or DOM element(s)
   * @returns {Object} domMan object
   */
  domMan.pt = domMan.prototype = {
    // The current version of domMan being used
    domMan: version,
    constructor: domMan,
    length: 0,

    // Initialization function
    init: function (selector) {
      if (!selector) return this;

      if (
        selector instanceof Node ||
        selector instanceof NodeList ||
        selector instanceof HTMLCollection
      ) {
        this.elements = selector;
      } else if (Array.isArray(selector) && selector[0] instanceof Element) {
        this.elements = selector;
      } else if (typeof selector === "string") {
        const elements = document.querySelectorAll(selector);
        this.elements = elements.length === 1 ? elements[0] : elements;
      } else if (selector instanceof domMan) {
        this.elements = selector.elements;
      } else {
        this.elements = [];
      }

      return this;
    },

    // Helper method to get elements
    _getElements: function () {
      return this.elements || [];
    },
    // ---- Dimension Methods ----

    // ---- Content Methods ----

    /**
     * Get or set the value of an input element
     * @param {string} [value] - Value to set
     * @returns {(string|Object)} Current value or domMan object for chaining
     */
    val: function (value) {
      const elements = this._getElements();
      if (!elements) return this;

      if (value !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].value = value;
          }
        } else {
          elements.value = value;
        }
        return this;
      } else {
        return elements instanceof NodeList ||
          elements instanceof HTMLCollection
          ? elements[0].value
          : elements.value;
      }
    },

    /**
     * Get or set the text content of an element
     * @param {string} [text] - Text content to set
     * @returns {(string|Object)} Current text or domMan object for chaining
     */
    textContent: function (text) {
      const elements = this._getElements();
      if (!elements) return this;

      if (text !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].textContent = text;
          }
        } else {
          elements.textContent = text;
        }
        return this;
      } else {
        return elements instanceof NodeList ||
          elements instanceof HTMLCollection
          ? elements[0].textContent
          : elements.textContent;
      }
    },
    /**
     * Get or set the outer HTML of an element
     * @param {string} [html] - HTML to set
     * @returns {(string|Object)} Current outerHTML or domMan object for chaining
     */
    outerHTML: function (html) {
      const elements = this._getElements();
      if (!elements) return this;

      if (html !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].outerHTML = html;
          }
        } else {
          elements.outerHTML = html;
        }
        return this;
      } else {
        return elements instanceof NodeList ||
          elements instanceof HTMLCollection
          ? elements[0].outerHTML
          : elements.outerHTML;
      }
    },

    /**
     * Get or set the inner HTML of an element
     * @param {string} [html] - HTML to set
     * @returns {(string|Object)} Current HTML or domMan object for chaining
     */
    html: function (html) {
      const elements = this._getElements();
      if (!elements) return this;

      if (html !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].innerHTML = html;
          }
        } else {
          elements.innerHTML = html;
        }
        return this;
      } else {
        return elements instanceof NodeList ||
          elements instanceof HTMLCollection
          ? elements[0].innerHTML
          : elements.innerHTML;
      }
    },

    /**
     * Get or set the text content of an element
     * @param {string} [t] - Text to set
     * @returns {(string|Object)} Current text or domMan object for chaining
     */
    text: function (t) {
      const elements = this._getElements();
      if (!elements) return this;

      if (t !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].innerText = t;
          }
        } else {
          elements.innerText = t;
        }
        return this;
      } else {
        return elements instanceof NodeList ||
          elements instanceof HTMLCollection
          ? elements[0].innerText
          : elements.innerText;
      }
    },

    /**
     * Remove element from the DOM
     * @returns {Object} domMan object for chaining
     */
    remove: function () {
      const elements = this instanceof domMan ? this._getElements() : this;
      console.log(elements);

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].remove();
        }
      } else if (elements instanceof Element) {
        elements.remove();
      }
      return this;
    },

    /**
     * Clone an element
     * @param {boolean} deep - Whether to deep clone
     * @returns {Node} Cloned node
     */
    clone: function (deep) {
      const elements = this instanceof domMan ? this._getElements() : this;
      if (!elements) return null;
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        const clonedElements = [];
        for (let i = 0; i < elements.length; i++) {
          clonedElements.push(elements[i].cloneNode(deep));
        }
        return clonedElements;
      } else if (elements instanceof Element) {
        return elements.cloneNode(deep);
      }
    },

    /**
     * Replace element with another element
     * @param {Node} newelements - New element to replace with
     * @returns {Object} domMan object for chaining
     */
    replaceWith: function (newelements) {
      const elements = this._getElements();
      if (!elements || !elements.parentNode) return this;

      elements.parentNode.replaceChild(newelements, elements);
      return this;
    },
    /**
     * Append content to element
     * @param {Node|Object} ctn - Content to append
     * @returns {Object} domMan object for chaining
     */
    append: function (ctn) {
      if (!ctn) return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (ctn instanceof Array) {
        ctn.forEach((element) => {
          // console.log(element)
          elements.append(element);
        });
      } else if (
        elements instanceof NodeList ||
        elements instanceof HTMLCollection
      ) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof Element) {
            elements[i].append(ctn);
          }
        }
      } else if (elements instanceof Element) {
        elements.append(ctn);
      }

      return this;
    },
    /*
     * Prepend content to element
     * @param {Node|Object} ctn - Content to prepend
     * @returns {Object} domMan object for chaining
     */
    pre: function (ctn) {
      if (!ctn) return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof Element) {
            elements[i].prepend(ctn);
          }
        }
      } else if (elements instanceof Element) {
        elements.prepend(ctn);
      }

      return this;
    },
    prependTo: function (target) {
      const elements = this instanceof domMan ? this._getElements() : this;
      const targetElement =
        target instanceof domMan ? target._getElements() : target;

      if (elements instanceof NodeList) {
        elements.forEach(function (element) {
          targetElement.prepend(element);
        });
      } else {
        targetElement.prepend(elements);
      }
      return this;
    },

    /**
     * Append the current element(s) to the target element
     * @param {Element|NodeList} target - The target element to append to
     * @returns {Object} domMan object for chaining
     */
    appendTo: function (target) {
      const elements = this instanceof domMan ? this._getElements() : this;
      const targetElement =
        target instanceof domMan ? target._getElements() : target;

      if (elements instanceof NodeList) {
        elements.forEach(function (element) {
          targetElement.appendChild(element);
        });
      } else {
        targetElement.appendChild(elements);
      }
      return this;
    },
    /**
     * Hide an element
     * @returns {Object} domMan object for chaining
     */
    hide: function () {
      const elements = this._getElements();
      if (!elements) return this;

      // Handle NodeList or HTMLCollection
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof Element) {
            elements[i].style.display = "none";
          }
        }
      } else if (elements instanceof Element) {
        // Handle single element
        elements.style.display = "none";
      }

      return this;
    },
    // ---- Style Methods ----

    /**
     * Set CSS property
     * @param {string} property - CSS property
     * @param {string} style - CSS value
     * @returns {Object} domMan object for chaining
     */
    css: function (prop, value) {
      const elements = this._getElements();
      if (elements instanceof Element) {
        elements.style[prop] = value;
      } else if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].style[prop] = value;
        }
      }
      return this;
    },
    /**
     * Set multiple CSS properties
     * @param {Object} ob - Object with CSS properties and values
     * @returns {Object} domMan object for chaining
     */
    cssObject: function (ob) {
      if (!ob || typeof ob !== "object") return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          for (const [key, value] of Object.entries(ob)) {
            elements[i].style.setProperty(key, value);
          }
        }
      } else if (elements instanceof Element) {
        for (const [key, value] of Object.entries(ob)) {
          elements.style.setProperty(key, value);
        }
      }

      return this;
    },

    // ---- Class Methods ----

    /**
     * Add a class to element
     * @param {string} className - Class to add
     * @returns {Object} domMan object for chaining
     */
    addClass: function (className) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.add(className);
        }
      } else if (elements instanceof Element) {
        elements.classList.add(className);
      }
      return this;
    },
    /**
     * Remove a class from element
     * @param {string} className - Class to remove
     * @returns {Object} domMan object for chaining
     */
    removeClass: function (className) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.remove(className);
        }
      } else if (elements instanceof Element) {
        elements.classList.remove(className);
      }
      return this;
    },
    /**
     * Toggle a class on element
     * @param {string} className - Class to toggle
     * @returns {Object} domMan object for chaining
     */
    toggleClass: function (className) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.toggle(className);
        }
      } else if (elements instanceof Element) {
        elements.classList.toggle(className);
      }
      return this;
    },
    /**
     * Check if element has a class
     * @param {string} className - Class to check
     * @returns {boolean} True if element has the class
     */
    hasClass: function (className) {
      const elements = this._getElements();
      if (!elements) return false;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        return elements.length > 0 && elements[0].classList.contains(className);
      } else if (elements instanceof Element) {
        return elements.classList.contains(className);
      }
      return false;
    },
    // ---- Event Methods ----

    /**
     * Execute function when DOM is ready
     * @param {Function} arg - Function to execute
     * @returns {Object} domMan object for chaining
     */
    onReady: function (callback) {
      if (typeof callback !== "function") {
        return this;
      }

      if (document.readyState !== "loading") {
        callback();
      } else {
        document.addEventListener("DOMContentLoaded", callback);
      }
      return this;
    },
    /**
     * Add event listener
     * @param {string} evt - Event name
     * @param {Function} fn - Event handler
     * @returns {Object} domMan object for chaining
     */
    on: function (evt, fn) {
      if (!evt || !fn) return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof EventTarget) {
            elements[i].addEventListener(evt, fn);
          }
        }
      } else if (elements instanceof EventTarget) {
        elements.addEventListener(evt, fn);
      }

      return this;
    },
    /**
     * Remove event listener
     * @param {string} evt - Event name
     * @param {Function} fn - Event handler
     * @returns {Object} domMan object for chaining
     */
    off: function (evt, fn) {
      if (!evt || !fn) return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof EventTarget) {
            elements[i].removeEventListener(evt, fn);
          }
        }
      } else if (elements instanceof EventTarget) {
        elements.removeEventListener(evt, fn);
      }

      return this;
    },
    // ---- Attribute Methods ----
    /**
     * Set attribute
     * @param {string} att - Attribute name
     * @param {string} val - Attribute value
     * @returns {Object} domMan object for chaining
     */

    // ---- Utility Methods ----

    /**
     * Apply alternating row colors to table
     * @param {string} odd - Color for odd rows
     * @param {string} even - Color for even rows
     * @returns {Object} domMan object for chaining
     */
    alternateColors: function (odd, even) {
      const elements = this._getElements();
      if (!elements) return this;

      let rows = [];

      if (elements instanceof HTMLTableElement) {
        rows = elements.rows;
      } else if (elements instanceof HTMLTableSectionElement) {
        rows = elements.rows;
      } else if (
        elements instanceof NodeList ||
        elements instanceof HTMLCollection
      ) {
        rows = elements;
      } else {
        console.warn(
          "alternateColors only works with tables or collections of table rows"
        );
        return this;
      }

      for (let i = 0; i < rows.length; i++) {
        if (rows[i] instanceof Element) {
          rows[i].style.backgroundColor = i % 2 === 0 ? even : odd;
        }
      }

      return this;
    },
    /**
     * Create a new DOM element
     * @param {string} e - Element tag name
     * @param {Object} [attributes] - Attributes to set
     * @returns {Object} New domMan wrapped element
     */
    createElement: function (e, attributes) {
      if (!e || typeof e !== "string") {
        console.error("Element type must be a valid string");
        return null;
      }

      try {
        let element = document.createElement(e);

        if (attributes && typeof attributes === "object") {
          Object.entries(attributes).forEach(([key, value]) => {
            if (key === "class" || key === "className") {
              element.className = value;
            } else if (key === "style" && typeof value === "object") {
              Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
              });
            } else if (key.startsWith("on") && typeof value === "function") {
              const eventName = key.slice(2).toLowerCase();
              element.addEventListener(eventName, value);
            } else {
              element.setAttribute(key, value);
            }
          });
        }

        return element;
      } catch (error) {
        console.error("Error creating element:", error);
        return null;
      }
    },
    deepClone: function (obj) {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }

      if (obj instanceof Node) {
        return obj.cloneNode(true);
      }

      if (Array.isArray(obj)) {
        const arrCopy = [];
        obj.forEach((item, index) => {
          arrCopy[index] = this.deepClone(item);
        });
        return arrCopy;
      }

      if (obj instanceof Object) {
        const objCopy = {};
        Object.keys(obj).forEach((key) => {
          objCopy[key] = this.deepClone(obj[key]);
        });
        return objCopy;
      }

      throw new Error("Unable to copy object! Its type isn't supported.");
    },
    /**
     * Validate CSS selector
     * @param {string} selector - CSS selector to validate
     * @returns {boolean} True if valid
     */
    isValidSelector: function (selector) {
      const regex =
        /^(?:#([\w-]+)|(\w+)|\.([\w-]+)|(\w+[\w\s>+~.#-]*|\[\w+[\^$*]?=.+\]))$/;
      return regex.test(selector);
    },
    /**
     * Find elements within the current element
     * @param {string} selector - CSS selector
     * @returns {Object} domMan object with found elements
     */
    find: function (selector) {
      const elements = this._getElements();
      if (!elements || !selector) return this;

      if (elements instanceof Element) {
        return $d(elements.querySelectorAll(selector));
      }
      return this;
    },
    /**
     * Execute a callback for each element
     * @param {Function} callback - Function to execute
     * @returns {Object} domMan object for chaining
     */
    each: function (callback) {
      const elements = this._getElements();
      if (!elements || typeof callback !== "function") return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          callback.call(elements[i], i, elements[i]);
        }
      } else if (elements instanceof Element) {
        callback.call(elements, 0, elements);
      }

      return this;
    },

    // ---- Utility Methods ----

    /**
     * Check if object is a DOM element
     * @param {*} obj - Object to check
     * @returns {boolean} True if object is DOM element
     */
    isElement: function (obj) {
      return obj instanceof Element;
    },
    /**
     * Execute function when DOM is ready
     * @param {Function} fn - Function to execute
     * @returns {Object} domMan object for chaining
     */
    ready: function (fn) {
      if (document.readyState !== "loading") {
        fn();
      } else {
        document.addEventListener("DOMContentLoaded", fn);
      }
      return this;
    },

    // ---- AMD & Global Setup ----
    noConflict: function (deep) {
      // Always restore window.$d if it was overwritten by domMan
      if (window.$d === domMan) {
        window.$d = _$d;
      }

      // Always restore window.domMan
      if (window.domMan === domMan) {
        window.domMan = _domMan;
      }

      if (deep) {
        // Create a completely isolated copy of domMan
        var clonedDomMan = function (selector) {
          return new clonedDomMan.pt.init(selector);
        };

        // Deep clone the prototype
        clonedDomMan.pt = clonedDomMan.prototype = domMan.deepClone(domMan.pt);

        // Fix constructor reference
        clonedDomMan.pt.constructor = clonedDomMan;

        // Clone the initialization function
        var clonedInit = function (selector) {
          if (!selector) return this;

          if (
            selector instanceof Node ||
            selector instanceof NodeList ||
            selector instanceof HTMLCollection
          ) {
            this.elements = selector;
          } else if (
            Array.isArray(selector) &&
            selector[0] instanceof Element
          ) {
            this.elements = selector;
          } else if (typeof selector === "string") {
            const elements = document.querySelectorAll(selector);
            this.elements = elements.length === 1 ? elements[0] : elements;
          } else if (selector instanceof domMan) {
            this.elements = selector.elements;
          } else {
            this.elements = [];
          }

          return this;
        };

        // Set up the init function
        clonedDomMan.pt.init = clonedInit;
        clonedInit.prototype = clonedDomMan.pt;

        // Copy utility methods directly to the cloned object
        clonedDomMan.isElement = domMan.isElement;
        clonedDomMan.ready = domMan.ready;
        clonedDomMan.deepClone = domMan.deepClone;

        return clonedDomMan;
      }

      return domMan;
    },

    /**
     * Event delegation for efficient event handling
     * @param {string} selector - CSS selector for target elements
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @returns {Object} domMan object for chaining
     */
    delegate: function (selector, event, handler) {
      const elements = this._getElements();
      if (!elements) return this;

      const delegatedHandler = function (e) {
        const targets = document.querySelectorAll(selector);
        const target = e.target;

        for (let i = 0; i < targets.length; i++) {
          let current = target;
          while (current && current !== this) {
            if (current === targets[i]) {
              // Call with the matching element as context
              handler.call(current, e);
              break;
            }
            current = current.parentNode;
          }
        }
      };

      return this.on(event, delegatedHandler);
    },
    // CSS
    /**
     * Add hover event handlers
     * @param {Function} enterFn - Function to execute on mouseenter
     * @param {Function} leaveFn - Function to execute on mouseleave
     * @returns {Object} domMan object for chaining
     */
    hover: function (enterFn, leaveFn) {
      const elements = this._getElements();
      if (!elements) return this;

      if (typeof enterFn === "function") {
        this.on("mouseenter", enterFn);
      }

      if (typeof leaveFn === "function") {
        this.on("mouseleave", leaveFn);
      }

      return this;
    },

    /**
     * Apply CSS pseudo-class effects
     * @param {string} pseudoClass - The pseudo-class to target (hover, active, focus, etc.)
     * @param {Object} styles - CSS properties to apply for the pseudo-class
     * @param {Object} [baseStyles] - CSS properties to apply to the base element
     * @param {Object} [options] - Additional options
     * @param {string} [options.timing] - Timing function for transitions (ease, linear, etc.)
     * @param {number} [options.duration] - Duration of transitions in ms
     * @returns {Object} domMan object for chaining
     */
    cssPseudo: function (pseudoClass, styles, baseStyles, options = {}) {
      const elements = this._getElements();
      if (!elements) return this;

      // Default options
      const settings = Object.assign(
        {
          timing: "ease",
          duration: 300,
        },
        options
      );

      // Generate a unique class name
      const uniqueId = "pseudo-" + Math.floor(Math.random() * 1000000);
      const uniqueClass = `domman-${uniqueId}`;

      // Store the class name for potential removal later
      this._lastPseudoClass = uniqueClass;

      // Apply the base class to all elements
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.add(uniqueClass);
        }
      } else if (elements instanceof Element) {
        elements.classList.add(uniqueClass);
      }

      // Create the style element if it doesn't exist
      let styleEl = document.getElementById("domman-pseudo-styles");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "domman-pseudo-styles";
        document.head.appendChild(styleEl);
      }

      // Build the CSS rules
      let cssRules = "";

      // Apply base styles if provided
      if (baseStyles && typeof baseStyles === "object") {
        cssRules += `.${uniqueClass} {`;
        for (const [prop, value] of Object.entries(baseStyles)) {
          cssRules += `${prop}: ${value}; `;
        }
        // Add transition if needed
        if (
          pseudoClass === "hover" ||
          pseudoClass === "active" ||
          pseudoClass === "focus"
        ) {
          cssRules += `transition: all ${settings.duration}ms ${settings.timing}; `;
        }
        cssRules += "} ";
      }

      // Apply pseudo-class styles
      cssRules += `.${uniqueClass}:${pseudoClass} {`;
      for (const [prop, value] of Object.entries(styles)) {
        cssRules += `${prop}: ${value}; `;
      }
      cssRules += "}";

      // Add the CSS rules to the style element
      styleEl.textContent += cssRules;

      // Store the unique class for reference
      this.data("last-pseudo-class", uniqueClass);

      return this;
    },

    /**
     * Improved cssHover with timing options
     * @param {Object} hoverStyles - CSS properties to apply on hover
     * @param {Object} [normalStyles] - CSS properties to apply when not hovering
     * @param {Object} [options] - Additional options
     * @param {string} [options.timing] - Timing function (ease, linear, ease-in-out, etc.)
     * @param {number} [options.duration] - Duration in milliseconds
     * @returns {Object} domMan object for chaining
     */
    cssHover: function (hoverStyles, normalStyles, options = {}) {
      // Use the more general cssPseudo method for hover
      return this.cssPseudo("hover", hoverStyles, normalStyles, options);
    },
    /**
     * Remove hover event handlers
     * @returns {Object} domMan object for chaining
     */
    removeHover: function () {
      const elements = this._getElements();
      if (!elements) return this;

      // Remove event listeners
      this.off("mouseenter");
      this.off("mouseleave");

      return this;
    },
    /**
     * Remove CSS-based hover effects
     * @param {string} [uniqueClass] - Optional specific class to remove (if known)
     * @returns {Object} domMan object for chaining
     */
    removeCssHover: function (uniqueClass) {
      const elements = this._getElements();
      if (!elements) return this;

      if (uniqueClass) {
        // Remove specific class
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove(uniqueClass);
          }
        } else if (elements instanceof Element) {
          elements.classList.remove(uniqueClass);
        }
      } else {
        // Remove all domman hover classes
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            const classes = Array.from(elements[i].classList);
            classes.forEach((cls) => {
              if (cls.startsWith("domman-hover-")) {
                elements[i].classList.remove(cls);
              }
            });
          }
        } else if (elements instanceof Element) {
          const classes = Array.from(elements.classList);
          classes.forEach((cls) => {
            if (cls.startsWith("domman-hover-")) {
              elements.classList.remove(cls);
            }
          });
        }
      }

      return this;
    },
    /**
     * Get or set CSS variables
     * @param {string|Object} varName - Variable name or object with variable name/value pairs
     * @param {string} [value] - Value to set (when varName is a string)
     * @returns {string|Object} Current object for chaining or variable value
     */
    cssVar: function (varName, value) {
      const elements = this._getElements();
      if (!elements) return this;

      // Getter mode
      if (typeof varName === "string" && value === undefined) {
        if (elements instanceof Element) {
          return getComputedStyle(elements)
            .getPropertyValue(`--${varName}`)
            .trim();
        }
        return null;
      }

      // Setter mode - single variable
      if (typeof varName === "string" && value !== undefined) {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            elements[i].style.setProperty(`--${varName}`, value);
          }
        } else if (elements instanceof Element) {
          elements.style.setProperty(`--${varName}`, value);
        }
        return this;
      }

      // Setter mode - multiple variables
      if (typeof varName === "object") {
        if (
          elements instanceof NodeList ||
          elements instanceof HTMLCollection
        ) {
          for (let i = 0; i < elements.length; i++) {
            for (const [name, val] of Object.entries(varName)) {
              elements[i].style.setProperty(`--${name}`, val);
            }
          }
        } else if (elements instanceof Element) {
          for (const [name, val] of Object.entries(varName)) {
            elements.style.setProperty(`--${name}`, val);
          }
        }
        return this;
      }

      return this;
    },
    /**
     * Watch element visibility using IntersectionObserver
     * @param {Function} callback - Function to call when visibility changes
     * @param {Object} [options] - IntersectionObserver options
     * @returns {Object} Current object for chaining
     */
    onIntersect: function (callback, options = {}) {
      const elements = this._getElements();
      if (!elements) return this;

      // Default options
      const defaultOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      };

      const observerOptions = Object.assign({}, defaultOptions, options);

      // Create observer
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // Call the callback with the entry and target
          callback.call(entry.target, entry, entry.target);
        });
      }, observerOptions);

      // Observe elements
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          observer.observe(elements[i]);
        }
      } else if (elements instanceof Element) {
        observer.observe(elements);
      }

      // Store observer for potential cleanup
      if (!this._observers) this._observers = [];
      this._observers.push(observer);

      return this;
    },

    /**
     * Stop observing element visibility
     * @returns {Object} Current object for chaining
     */
    unobserve: function () {
      const elements = this._getElements();
      if (!elements || !this._observers) return this;

      // Disconnect all associated observers
      this._observers.forEach((observer) => {
        observer.disconnect();
      });

      this._observers = [];

      return this;
    },
    /**
     * Watch element size changes using ResizeObserver
     * @param {Function} callback - Function to call when size changes
     * @returns {Object} Current object for chaining
     */
    onResize: function (callback) {
      const elements = this._getElements();
      if (!elements) return this;

      // Create observer
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          // Call the callback with the entry and target
          callback.call(entry.target, entry, entry.target);
        });
      });

      // Observe elements
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          observer.observe(elements[i]);
        }
      } else if (elements instanceof Element) {
        observer.observe(elements);
      }

      // Store observer for potential cleanup
      if (!this._resizeObservers) this._resizeObservers = [];
      this._resizeObservers.push(observer);

      return this;
    },

    /**
     * Stop observing element size changes
     * @returns {Object} Current object for chaining
     */
    unobserveResize: function () {
      const elements = this._getElements();
      if (!elements || !this._resizeObservers) return this;

      // Disconnect all associated observers
      this._resizeObservers.forEach((observer) => {
        observer.disconnect();
      });

      this._resizeObservers = [];

      return this;
    },
    /**
     * Enhanced animation with keyframes
     * @param {Array|Object} keyframes - Array of keyframe objects or single keyframe object
     * @param {Object} options - Animation options
     * @returns {Object} Current object for chaining
     */
    animateKeyframes: function (keyframes, options = {}) {
      const elements = this._getElements();
      if (!elements) return this;

      // Default options
      const defaultOptions = {
        duration: 500,
        easing: "linear",
        fill: "forwards",
        iterations: 1,
        delay: 0,
        direction: "normal",
      };

      const animationOptions = Object.assign({}, defaultOptions, options);

      // Store animation references
      if (!this._animations) this._animations = new Map();

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          const animation = elements[i].animate(keyframes, animationOptions);

          if (options.onComplete && typeof options.onComplete === "function") {
            animation.onfinish = () =>
              options.onComplete.call(elements[i], elements[i]);
          }

          if (options.onCancel && typeof options.onCancel === "function") {
            animation.oncancel = () =>
              options.onCancel.call(elements[i], elements[i]);
          }

          this._animations.set(elements[i], animation);
        }
      } else if (elements instanceof Element) {
        const animation = elements.animate(keyframes, animationOptions);

        if (options.onComplete && typeof options.onComplete === "function") {
          animation.onfinish = () =>
            options.onComplete.call(elements, elements);
        }

        if (options.onCancel && typeof options.onCancel === "function") {
          animation.oncancel = () => options.onCancel.call(elements, elements);
        }

        this._animations.set(elements, animation);
      }

      return this;
    },

    /**
     * Pause current animations
     * @returns {Object} Current object for chaining
     */
    pauseAnimation: function () {
      if (!this._animations) return this;

      for (const animation of this._animations.values()) {
        animation.pause();
      }

      return this;
    },

    /**
     * Resume current animations
     * @returns {Object} Current object for chaining
     */
    resumeAnimation: function () {
      if (!this._animations) return this;

      for (const animation of this._animations.values()) {
        animation.play();
      }

      return this;
    },

    /**
     * Cancel current animations
     * @returns {Object} Current object for chaining
     */
    cancelAnimation: function () {
      if (!this._animations) return this;

      for (const animation of this._animations.values()) {
        animation.cancel();
      }

      this._animations.clear();

      return this;
    },
    /**
     * Fade in the element(s)
     * @param {number} duration - Duration of the fade-in effect in milliseconds
     * @param {function} callback - Callback function to execute after the fade-in effect
     * @returns {Object} domMan object for chaining
     */
    fadeIn: function (duration, callback) {
      const elements = this instanceof domMan ? this._getElements() : this;
      if (elements instanceof NodeList) {
        elements.forEach(function (element) {
          element.style.opacity = 0;
          element.style.display = "block";
          let last = +new Date();
          const tick = function () {
            element.style.opacity =
              +element.style.opacity + (new Date() - last) / duration;
            last = +new Date();
            if (+element.style.opacity < 1) {
              (window.requestAnimationFrame && requestAnimationFrame(tick)) ||
                setTimeout(tick, 16);
            } else {
              if (typeof callback === "function") {
                callback.call(element);
              }
            }
          };
          tick();
        });
      } else {
        elements.style.opacity = 0;
        elements.style.display = "block";
        let last = +new Date();
        const tick = function () {
          elements.style.opacity =
            +elements.style.opacity + (new Date() - last) / duration;
          last = +new Date();
          if (+elements.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) ||
              setTimeout(tick, 16);
          } else {
            if (typeof callback === "function") {
              callback.call(elements);
            }
          }
        };
        tick();
      }
      return this;
    },
    /*  
  
     Simple Animation Framework
  
    */
    // Base animation system
    animate: function (properties, duration = 400, easing = "ease", callback) {
      const elements = this._getElements();
      if (!elements) return this;

      if (!(elements instanceof Element)) return this;

      // Save current styles
      const startStyles = {};

      // Set transition
      elements.style.transition = `all ${duration}ms ${easing}`;

      // Apply properties
      for (const prop in properties) {
        if (properties.hasOwnProperty(prop)) {
          elements.style[prop] = properties[prop];
        }
      }

      // Handle callback when animation completes
      const transitionEnd = (e) => {
        elements.removeEventListener("transitionend", transitionEnd);
        if (typeof callback === "function") callback.call(elements);
      };

      elements.addEventListener("transitionend", transitionEnd);

      return this;
    },

    // ---- Data Storage ----
    /**
     * Store or retrieve data for an element
     * @param {string} [key] - The data key
     * @param {*} [value] - The data value
     * @returns {(*|Object)} The stored data or domMan object for chaining
     */
    data: function (key, value) {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return this;

      // Initialize data store for this element if needed
      if (!elementData.has(elements)) {
        elementData.set(elements, {});
      }

      const store = elementData.get(elements);

      // Get all data
      if (arguments.length === 0) {
        return store;
      }

      // Get specific data
      if (arguments.length === 1) {
        return store[key];
      }

      // Set data
      store[key] = value;
      return this;
    },
    /**
     * Remove data from an element
     * @param {string} [key] - The data key to remove (or all if omitted)
     * @returns {Object} domMan object for chaining
     */
    removeData: function (key) {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return this;

      if (!elementData.has(elements)) return this;

      const store = elementData.get(elements);

      if (arguments.length === 0) {
        elementData.delete(elements);
      } else {
        delete store[key];
      }

      return this;
    },
    /**
     * Store data in localStorage
     * @param {string} key - The key under which the data is stored
     * @param {*} value - The data to store
     * @returns {Object} domMan object for chaining
     */
    setLocalStorage: function (key, value) {
      if (typeof key !== "string") {
        console.error("Invalid key for localStorage");
        return this;
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("Error setting localStorage:", e);
      }
      return this;
    },

    /**
     * Retrieve data from localStorage
     * @param {string} key - The key under which the data is stored
     * @returns {*} The retrieved data or null if not found
     */
    getLocalStorage: function (key) {
      if (typeof key !== "string") {
        console.error("Invalid key for localStorage");
        return null;
      }
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (e) {
        console.error("Error getting localStorage:", e);
        return null;
      }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - The key under which the data is stored
     * @returns {Object} domMan object for chaining
     */
    removeLocalStorage: function (key) {
      if (typeof key !== "string") {
        console.error("Invalid key for localStorage");
        return this;
      }
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("Error removing localStorage:", e);
      }
      return this;
    },

    /**
     * Clear all data from localStorage
     * @returns {Object} domMan object for chaining
     */
    clearLocalStorage: function () {
      try {
        localStorage.clear();
      } catch (e) {
        console.error("Error clearing localStorage:", e);
      }
      return this;
    },

    // ---- DOM Traversal Methods ----
    // ---- DOM Traversal Methods ----
    /**
     * Get the parent element
     * @returns {Object} domMan object with the parent
     */
    parent: function () {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof Element && elements.parentElement) {
        return $d(elements.parentElement);
      }
      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        return $d(elements[0].parentElement);
      }

      return this;
    },
    /**
     * Get all child elements
     * @returns {Object} domMan object with the children
     */
    children: function () {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof Element) {
        return $d(elements.children);
      }

      return $d(null);
    },
    /**
     * Get sibling elements
     * @returns {Object} domMan object with the siblings
     */
    siblings: function () {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return $d([]);

      const parent = elements.parentElement;
      const siblings = Array.from(parent.children).filter(
        (child) => child !== elements
      );

      return $d(siblings);
    },

    // ---- AJAX Methods ----
    /* Promise-Based AJAX */

    /**
     * Simple AJAX request
     * @param {Object} options - Configuration options
     * @returns {Promise} Promise that resolves with the response
     */
    ajax: function (options) {
      const settings = Object.assign(
        {
          method: "GET",
          url: "",
          data: null,
          headers: {},
          responseType: "json",
        },
        options
      );

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(settings.method, settings.url, true);
        xhr.responseType = settings.responseType;

        // Set headers
        for (const header in settings.headers) {
          xhr.setRequestHeader(header, settings.headers[header]);
        }

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject({
              status: xhr.status,
              statusText: xhr.statusText,
              response: xhr.response,
            });
          }
        };

        xhr.onerror = function () {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.response,
          });
        };

        xhr.send(settings.data);
      });
    },
    // Helper methods for common AJAX requests
    get: function (url, data = null, options = {}) {
      const settings = Object.assign({}, options, {
        method: "GET",
        url: url,
        data: data,
      });
      return this.ajax(settings);
    },
    post: function (url, data = null, options = {}) {
      const settings = Object.assign({}, options, {
        method: "POST",
        url: url,
        data: data,
      });
      return this.ajax(settings);
    },

    // ---- Plugin Architecture ----
    //Plugin Architecture
    /**
     * Extend domMan with new functionality
     * @param {Object} methods - Object containing methods to add
     */
    extend: function (methods) {
      for (const name in methods) {
        if (methods.hasOwnProperty(name)) {
          // Don't override existing methods
          if (!domMan.pt[name]) {
            domMan.pt[name] = methods[name];
          } else {
            console.warn(
              `Cannot extend domMan: Method '${name}' already exists.`
            );
          }
        }
      }
      return domMan;
    },

    // ---- CSS Transitions ----
    /*   
  
   ## 7. CSS Transitions
  
  
    /**
     * Add a CSS class with transition effects
     * @param {string} className - Class to add
     * @param {number} duration - Transition duration in ms
     * @returns {Object} domMan object for chaining
     */
    addClassWithTransition: function (className, duration = 300) {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return this;

      // Store original transition
      const originalTransition = elements.style.transition;

      // Set transition duration
      elements.style.transition = `all ${duration}ms`;

      // Force a reflow to ensure the transition takes effect
      void elements.offsetWidth;

      // Add the class
      elements.classList.add(className);

      // Reset transition after animation completes
      setTimeout(() => {
        elements.style.transition = originalTransition;
      }, duration);

      return this;
    },

    // ---- Form Data Handling ----
    /* Form Data Handling */

    /**
     * Serialize form data to different formats
     * @param {string} [format='object'] - Output format ('object', 'json', 'urlencoded')
     * @returns {(Object|string)} Serialized form data
     */
    serializeForm: function (format = "object") {
      const elements = this._getElements();
      if (!elements || !(elements instanceof HTMLFormElement)) {
        console.error("serializeForm requires a form element");
        return format === "object" ? {} : format === "json" ? "{}" : "";
      }

      const formData = new FormData(elements);
      const result = {};

      formData.forEach((value, key) => {
        // Handle multiple values for the same key (like checkboxes)
        if (result[key]) {
          if (!Array.isArray(result[key])) {
            result[key] = [result[key]];
          }
          result[key].push(value);
        } else {
          result[key] = value;
        }
      });

      if (format === "object") {
        return result;
      } else if (format === "json") {
        return JSON.stringify(result);
      } else if (format === "urlencoded") {
        return Object.keys(result)
          .map((key) => {
            const val = result[key];
            if (Array.isArray(val)) {
              return val
                .map(
                  (v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
                )
                .join("&");
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
          })
          .join("&");
      }

      return result;
    },
    /**
     * Submit form with optional AJAX
     * @param {boolean} [ajax=false] - Use AJAX for submission
     * @param {Function} [callback] - Callback after submission
     * @returns {Object} domMan object for chaining
     */
    submitForm: function (ajax = false, callback) {
      const elements = this._getElements();
      if (!elements || !(elements instanceof HTMLFormElement)) {
        console.error("submitForm requires a form element");
        return this;
      }

      if (!ajax) {
        elements.submit();
        return this;
      }

      // AJAX submission
      const method = elements.method.toUpperCase() || "GET";
      const url = elements.action || window.location.href;
      const data = new FormData(elements);

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      xhr.onload = function () {
        if (typeof callback === "function") {
          callback(xhr.status, xhr.responseText, xhr);
        }
      };

      xhr.onerror = function () {
        if (typeof callback === "function") {
          callback(xhr.status, null, xhr);
        }
      };

      xhr.send(data);
      return this;
    },
    /**
     * Reset form fields
     * @returns {Object} domMan object for chaining
     */
    resetForm: function () {
      const elements = this._getElements();
      if (!elements || !(elements instanceof HTMLFormElement)) {
        console.error("resetForm requires a form element");
        return this;
      }

      elements.reset();
      return this;
    },
    /**
     * Get or set form field values
     * @param {string} [name] - Field name
     * @param {*} [value] - Value to set
     * @returns {(*|Object)} Field value or domMan object for chaining
     */
    formValue: function (name, value) {
      const elements = this._getElements();
      if (!elements) return value !== undefined ? this : null;

      // Get form element if we're working with a form
      let form = elements instanceof HTMLFormElement ? elements : null;

      // If we have a field element directly
      if (
        !form &&
        elements instanceof HTMLElement &&
        (elements.tagName === "INPUT" ||
          elements.tagName === "SELECT" ||
          elements.tagName === "TEXTAREA" ||
          elements.tagName === "BUTTON")
      ) {
        if (value !== undefined) {
          elements.value = value;
          return this;
        }
        return elements.value;
      }

      // Find the form if we have another element
      if (!form && elements instanceof HTMLElement) {
        form = elements.closest("form");
      }

      if (!form) return value !== undefined ? this : null;

      // If no name is provided, get all values
      if (!name) {
        return this.serializeForm("object");
      }

      const field = form.elements[name];
      if (!field) return value !== undefined ? this : null;

      // Handle setting values
      if (value !== undefined) {
        // Handle radio buttons and checkboxes
        if (field.length && field[0].type === "radio") {
          Array.from(field).forEach((radio) => {
            radio.checked = radio.value === value;
          });
        } else if (field.type === "checkbox") {
          field.checked = !!value;
        } else {
          field.value = value;
        }
        return this;
      }

      // Handle getting values
      if (field.type === "checkbox") {
        return field.checked;
      }
      if (field.length && field[0].type === "radio") {
        const checked = Array.from(field).find((radio) => radio.checked);
        return checked ? checked.value : null;
      }

      return field.value;
    },

    // ---- Enhanced Input Validation ----
    /**
     * Validate form fields
     * @param {Object} [rules] - Validation rules {fieldName: {rule: value, message: string}}
     * @param {Object} [options] - Options for validation behavior
     * @returns {Object} Validation result {valid: boolean, errors: {field: message}}
     */
    validate: function (rules = {}, options = {}) {
      const elements = this._getElements();
      if (!elements)
        return { valid: false, errors: { general: "No element found" } };

      // Default options
      const settings = Object.assign(
        {
          showErrors: true,
          errorClass: "error",
          errorMessageClass: "error-message",
          validateOnBlur: false,
        },
        options
      );

      // Find the form
      let form;
      if (elements instanceof HTMLFormElement) {
        form = elements;
      } else if (elements instanceof HTMLElement) {
        form = elements.closest("form");
      }

      if (!form)
        return { valid: false, errors: { general: "No form element found" } };

      // Initialize validation state
      let isValid = true;
      const errors = {};

      // Set up field validation function
      const validateField = (field, fieldRules) => {
        // Skip fields without rules
        if (!fieldRules) return true;

        const name = field.name;
        const value = field.value;
        let fieldValid = true;
        let errorMessage = "";

        // Clear previous errors
        if (settings.showErrors) {
          field.classList.remove(settings.errorClass);
          const errorEl = form.querySelector(
            `.${settings.errorMessageClass}[data-for="${name}"]`
          );
          if (errorEl) errorEl.remove();
        }

        // Required check
        if (fieldRules.required && !value.trim()) {
          fieldValid = false;
          errorMessage = fieldRules.message || "This field is required";
        }
        // Pattern check
        else if (fieldRules.pattern && value) {
          const pattern =
            typeof fieldRules.pattern === "string"
              ? domMan.validationPatterns[fieldRules.pattern] ||
                new RegExp(fieldRules.pattern)
              : fieldRules.pattern;

          if (!pattern.test(value)) {
            fieldValid = false;
            errorMessage = fieldRules.message || `Invalid format`;
          }
        }
        // Min length
        else if (fieldRules.minLength && value.length < fieldRules.minLength) {
          fieldValid = false;
          errorMessage =
            fieldRules.message ||
            `Minimum length is ${fieldRules.minLength} characters`;
        }
        // Max length
        else if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
          fieldValid = false;
          errorMessage =
            fieldRules.message ||
            `Maximum length is ${fieldRules.maxLength} characters`;
        }
        // Min value
        else if (
          fieldRules.min &&
          parseFloat(value) < parseFloat(fieldRules.min)
        ) {
          fieldValid = false;
          errorMessage =
            fieldRules.message || `Minimum value is ${fieldRules.min}`;
        }
        // Max value
        else if (
          fieldRules.max &&
          parseFloat(value) > parseFloat(fieldRules.max)
        ) {
          fieldValid = false;
          errorMessage =
            fieldRules.message || `Maximum value is ${fieldRules.max}`;
        }
        // Custom validation function
        else if (
          fieldRules.validate &&
          typeof fieldRules.validate === "function"
        ) {
          const result = fieldRules.validate(value, form);
          if (result !== true) {
            fieldValid = false;
            errorMessage = result || fieldRules.message || "Invalid value";
          }
        }

        // Show errors if needed
        if (!fieldValid && settings.showErrors) {
          field.classList.add(settings.errorClass);

          const errorEl = document.createElement("div");
          errorEl.className = settings.errorMessageClass;
          errorEl.setAttribute("data-for", name);
          errorEl.textContent = errorMessage;

          // Insert after the field
          field.parentNode.insertBefore(errorEl, field.nextSibling);
        }

        if (!fieldValid) {
          errors[name] = errorMessage;
        }

        return fieldValid;
      };

      // Set up blur event handlers if needed
      if (settings.validateOnBlur) {
        for (const fieldName in rules) {
          const field = form.elements[fieldName];
          if (field) {
            field.addEventListener("blur", function () {
              validateField(this, rules[fieldName]);
            });
          }
        }
      }

      // Validate all fields with rules
      for (const fieldName in rules) {
        const field = form.elements[fieldName];
        if (!field) continue;

        const fieldIsValid = validateField(field, rules[fieldName]);
        isValid = isValid && fieldIsValid;
      }

      return {
        valid: isValid,
        errors: errors,
      };
    },
    /**
     * Apply HTML5 validation attributes based on rules
     * @param {Object} rules - Validation rules
     * @returns {Object} domMan object for chaining
     */
    applyValidationAttributes: function (rules) {
      const elements = this._getElements();
      if (!elements || !(elements instanceof HTMLFormElement)) {
        console.error("applyValidationAttributes requires a form element");
        return this;
      }

      for (const fieldName in rules) {
        const field = elements.elements[fieldName];
        const fieldRules = rules[fieldName];

        if (!field || !fieldRules) continue;

        // Set required attribute
        if (fieldRules.required) {
          field.setAttribute("required", "");
        }

        // Set pattern attribute
        if (fieldRules.pattern && typeof fieldRules.pattern === "string") {
          const pattern = domMan.validationPatterns[fieldRules.pattern];
          if (pattern) {
            // Strip the leading ^ and trailing $ from the regex source
            let patternStr = pattern.source;
            if (patternStr.startsWith("^"))
              patternStr = patternStr.substring(1);
            if (patternStr.endsWith("$"))
              patternStr = patternStr.substring(0, patternStr.length - 1);
            field.setAttribute("pattern", patternStr);
          }
        }

        // Set min/max attributes for number inputs
        if (field.type === "number" || field.type === "range") {
          if (fieldRules.min !== undefined)
            field.setAttribute("min", fieldRules.min);
          if (fieldRules.max !== undefined)
            field.setAttribute("max", fieldRules.max);
        }

        // Set minlength/maxlength for text inputs
        if (
          field.type === "text" ||
          field.type === "password" ||
          field.type === "search" ||
          field.type === "email" ||
          field.type === "tel" ||
          field.type === "url"
        ) {
          if (fieldRules.minLength)
            field.setAttribute("minlength", fieldRules.minLength);
          if (fieldRules.maxLength)
            field.setAttribute("maxlength", fieldRules.maxLength);
        }
      }

      return this;
    },

    // ---- Additional Methods ----
    // Create a new element with specified attributes
    create: function (tagName, attributes = {}) {
      const element = document.createElement(tagName);
      for (const key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          element[key] = attributes[key];
        }
      }
      return element;
    },
    /**
     * Create an element with a namespace
     * @param {string} namespace - The namespace URI
     * @param {string} tagName - Tag name of the element to create
     * @param {Object} [attributes] - Optional attributes to set on the element
     * @returns {Element} Created element
     */
    createElementNS: function (namespace, tagName, attributes = {}) {
      // Create the element with namespace
      const element = document.createElementNS(namespace, tagName);

      // Set attributes
      for (const [key, value] of Object.entries(attributes)) {
        // Handle special cases
        if (key === "className" || key === "class") {
          element.setAttribute("class", value);
        } else if (key === "style" && typeof value === "object") {
          // Handle style object
          for (const [styleKey, styleValue] of Object.entries(value)) {
            element.style[styleKey] = styleValue;
          }
        } else if (key.startsWith("on") && typeof value === "function") {
          // Handle event handlers
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value);
        } else {
          // Handle regular attributes
          element.setAttribute(key, value);
        }
      }

      return element;
    },
    /**
     * Create an SVG element with appropriate namespace
     * @param {string} tagName - SVG element tag name
     * @param {Object} [attributes] - Optional attributes to set on the element
     * @returns {SVGElement} Created SVG element
     */
    createSVG: function (tagName, attributes = {}) {
      return this.createElementNS(
        "http://www.w3.org/2000/svg",
        tagName,
        attributes
      );
    },
    /**
     * Get the value of an attribute
     * @param {string} att - Attribute name
     * @returns {string} Attribute value
     */

    /**
     * Remove an attribute from an element
     * @param {string} att - Attribute name
     * @returns {Object} domMan object for chaining
     */

    /**
     * Remove event listener
     * @param {string} evt - Event name
     * @param {Function} fn - Event handler
     * @returns {Object} domMan object for chaining
     */
    off: function (evt, fn) {
      if (!evt || !fn) return this;

      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] instanceof EventTarget) {
            elements[i].removeEventListener(evt, fn);
          }
        }
      } else if (elements instanceof EventTarget) {
        elements.removeEventListener(evt, fn);
      }

      return this;
    },
    /**
     * Insert content before an element
     * @param {Node|Object} ctn - Content to insert
     * @returns {Object} domMan object for chaining
     */
    before: function (ctn) {
      if (!ctn) return this;

      const elements = this._getElements();
      if (!elements || !elements.parentNode) return this;

      elements.parentNode.insertBefore(ctn, elements);
      return this;
    },
    /**
     * Insert content after an element
     * @param {Node|Object} ctn - Content to insert
     * @returns {Object} domMan object for chaining
     */
    after: function (ctn) {
      if (!ctn) return this;

      const elements = this._getElements();
      if (!elements || !elements.parentNode) return this;

      elements.parentNode.insertBefore(ctn, elements.nextSibling);
      return this;
    },
    /**
     * Get the next sibling element
     * @returns {Object} domMan object with the next sibling
     */
    next: function () {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return $d(null);

      return $d(elements.nextElementSibling);
    },
    /**
     * Get the previous sibling element
     * @returns {Object} domMan object with the previous sibling
     */
    prev: function () {
      const elements = this._getElements();
      if (!elements || !(elements instanceof Element)) return $d(null);

      return $d(elements.previousElementSibling);
    },
    /**
     * Check if an element is empty
     * @returns {boolean} True if element is empty
     */
    isEmpty: function () {
      const elements = this._getElements();
      if (!elements) return true;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        return elements.length === 0;
      } else if (elements instanceof Element) {
        return elements.innerHTML.trim() === "";
      }
      return true;
    },

    /**
     * Paginate content and provide navigation controls.
     *
     * @param {Array} content - The content to be paginated.
     * @param {number} itemsPerPage - The number of items to display per page.
     * @param {function} renderCallback - A callback function to render the content for each page.
     *                                    It receives three arguments: `pageContent` (the content for the current page),
     *                                    `page` (the current page number), and `totalPages` (the total number of pages).
     * @param {number} [maxPageNumbers=5] - The maximum number of page numbers to display in the pagination controls.
     * @returns {Object} domMan object for chaining.
     */
    paginate: function (
      content,
      itemsPerPage,
      renderCallback,
      maxPageNumbers = 5
    ) {
      if (
        !Array.isArray(content) ||
        typeof itemsPerPage !== "number" ||
        typeof renderCallback !== "function"
      ) {
        console.error("Invalid arguments for paginate method");
        return this;
      }

      const totalPages = Math.ceil(content.length / itemsPerPage);
      let currentPage = 1;

      const renderPage = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageContent = content.slice(start, end);
        renderCallback(pageContent, page, totalPages);
        updateURL(page);
        renderPaginationControls(page);
      };

      const updateURL = (page) => {
        const url = new URL(window.location);
        url.searchParams.set("page", page);
        window.history.pushState({}, "", url);
      };

      const renderPaginationControls = (page) => {
        const paginationControls = $d(".pagination-controls");
        $d(paginationControls).html("");

        const firstButton = $d().createElement("button", {
          className: "pagination-first",
        });
        $d(firstButton).textContent("First");
        $d(paginationControls).append(firstButton);

        const prevButton = $d().createElement("button", {
          className: "pagination-prev",
        });
        $d(prevButton).textContent("Previous");
        $d(paginationControls).append(prevButton);

        const startPage = Math.max(1, page - Math.floor(maxPageNumbers / 2));
        const endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

        for (let i = startPage; i <= endPage; i++) {
          const pageButton = $d().createElement("button", {
            className: "pagination-page",
          });
          $d(pageButton).textContent(i);
          if (i === page) {
            $d(pageButton).addClass("active");
          }
          $d(paginationControls).append(pageButton);
        }

        const nextButton = $d().createElement("button", {
          className: "pagination-next",
        });
        $d(nextButton).textContent("Next");
        $d(paginationControls).append(nextButton);

        const lastButton = $d().createElement("button", {
          className: "pagination-last",
        });
        $d(lastButton).textContent("Last");
        $d(paginationControls).append(lastButton);
      };

      const firstHandler = () => {
        if (currentPage > 1) {
          currentPage = 1;
          renderPage(currentPage);
        }
      };

      const lastHandler = () => {
        if (currentPage < totalPages) {
          currentPage = totalPages;
          renderPage(currentPage);
        }
      };

      const nextHandler = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
        }
      };

      const prevHandler = () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
        }
      };

      const pageHandler = (e) => {
        const page = parseInt(e.target.textContent, 10);
        if (!isNaN(page) && page !== currentPage) {
          currentPage = page;
          renderPage(currentPage);
        }
      };

      this.delegate(".pagination-first", "click", firstHandler);
      this.delegate(".pagination-last", "click", lastHandler);
      this.delegate(".pagination-next", "click", nextHandler);
      this.delegate(".pagination-prev", "click", prevHandler);
      this.delegate(".pagination-page", "click", pageHandler);

      renderPage(currentPage);
      return this;
    },
    createTextNode: (text) => {
      return document.createTextNode(text);
    },
    createComment: (text) => {
      return document.createComment(text);
    },
    createDocumentFragment: () => {
      return document.createDocumentFragment();
    },

    // Node manipulation
    appendChild: function (child) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].appendChild(child);
        }
      } else if (elements instanceof Element) {
        elements.appendChild(child);
      }

      return this;
    },
    removeChild: function (child) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].contains(child)) {
            elements[i].removeChild(child);
          }
        }
      } else if (elements instanceof Element) {
        if (elements.contains(child)) {
          elements.removeChild(child);
        }
      }

      return this;
    },
    replaceChild: function (newChild, oldChild) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].contains(oldChild)) {
            elements[i].replaceChild(newChild, oldChild);
          }
        }
      } else if (elements instanceof Element) {
        if (elements.contains(oldChild)) {
          elements.replaceChild(newChild, oldChild);
        }
      }

      return this;
    },
    insertBefore: function (newNode, referenceNode) {
      const elements = this._getElements();
      if (!elements) return this;

      if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].contains(referenceNode)) {
            elements[i].insertBefore(newNode, referenceNode);
          }
        }
      } else if (elements instanceof Element) {
        if (elements.contains(referenceNode)) {
          elements.insertBefore(newNode, referenceNode);
        }
      }

      return this;
    },
    // Node properties
    childNodes: function () {
      const elements = this._getElements();
      if (!elements) return [];

      if (elements instanceof Element) {
        return Array.from(elements.childNodes);
      }

      return [];
    },
    firstChild: function () {
      const elements = this._getElements();
      console.log(elements);
      return elements.firstChild;
    },
    lastChild: function () {
      const elements = this._getElements();
      if (!elements) return null;

      if (elements instanceof Element) {
        return elements.lastChild;
      }

      return null;
    },
                getAttribute: function (att) {
              const elements = this._getElements();
              if (!elements) return null;
        
              if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                return elements.length > 0 ? elements[0].getAttribute(att) : null;
              } else if (elements instanceof Element) {
                return elements.getAttribute(att);
              }
              return null;
            },
            setAttribute: function(name, value) {
              const elements = this._getElements();
              if (!elements) return this;
              
              if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                for (let i = 0; i < elements.length; i++) {
                  elements[i].setAttribute(name, value);
                }
              } else if (elements instanceof Element) {
                elements.setAttribute(name, value);
              }
              
              return this;
            }, 
    /**
     * Remove an attribute from an element
     * @param {string} att - Attribute name
     * @returns {Object} domMan object for chaining
     */
                removeAttribute: function (att) {
              const elements = this._getElements();
              if (!elements) return this;
        
              if (elements instanceof NodeList || elements instanceof HTMLCollection) {
                for (let i = 0; i < elements.length; i++) {
                  elements[i].removeAttribute(att);
                }
              } else if (elements instanceof Element) {
                elements.removeAttribute(att);
              }
              return this;
            },
            hasAttribute: function(name) {
              const elements = this._getElements();
              if (!elements) return false;
              
              if (elements instanceof Element) {
                return elements.hasAttribute(name);
              }
              
              return false;
            }, 
    // ---- End of protype ----
  };
  // proxy test
  domMan.setDebugMode = function (enabled) {
    domMan.debugMode = !!enabled;
    return this;
  };
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    domMan.setDebugMode(true);
  }
  // Safe debug mode detection
  domMan.debugMode =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Add setter method for debug mode
  domMan.setDebugMode = function (enabled) {
    domMan.debugMode = !!enabled;
    return this;
  };

  // Then modify your Proxy implementation
  // Add to your domman.js file right after your existing Proxy implementation

  // Update your Proxy implementation
  // Update your Proxy implementation to handle both CSS and DOM properties

  domMan.pt = new Proxy(domMan.pt, {
    get(target, prop, receiver) {
      // console.log(`Prob :  ${prop} exists in ${target} Receiver is :  ` , receiver );
      // Define standard event types
      const standardEvents = [
        "click",
        "dblclick",
        "mouseover",
        "mouseout",
        "mouseenter",
        "mouseleave",
        "mousemove",
        "mouseup",
        "mousedown",
        "keydown",
        "keyup",
        "keypress",
        "change",
        "submit",
        "focus",
        "blur",
        "resize",
        "scroll",
        "load",
        "error",
        "focusin",
        "focusout",
        "select",
        "contextmenu",
        "input",
        "invalid",
        "reset",
        "search",
      ];

      // Event aliases mapping
      const aliases = {
        over: "mouseover",
        out: "mouseout",
        enter: "mouseenter",
        leave: "mouseleave",
        move: "mousemove",
        up: "mouseup",
        down: "mousedown",
      };

      // 1. If property already exists in target, return it
      if (prop in target) {
        
        return Reflect.get(target, prop, receiver);
      }

      // 2. Check if it's a standard event or alias
      if (standardEvents.includes(prop) || prop in aliases) {
        const eventName = aliases[prop] || prop;

        return function (fn) {
          if (!fn || typeof fn !== "function") return this;
          return this.on(eventName, fn);
        };
      }

      // 3. Check if it's a CSS property
      const tempElement = document.createElement("div");
      if (prop in tempElement.style) {
        return function (value) {
          const elements = this._getElements();
          if (!elements) return this;

          // Getter mode
          if (value === undefined) {
            if (elements instanceof Element) {
              return window.getComputedStyle(elements)[prop];
            }
            return null;
          }

          // Setter mode
          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i].style[prop] = value;
            }
          } else if (elements instanceof Element) {
            elements.style[prop] = value;
          }
          // console.log(`2607  ${receiver}`);
          return this;
        };
      }

      // 4. Check if it's a DOM property
      const domProperties = [
        "textContent",
        "innerHTML",
        "innerText",
        "outerHTML",
        "className",
        "id",
        "tagName",
        "nodeName",
        "nodeType",
        "nodeValue",
        "title",
        "lang",
        "dir",
        "attributes",
        "checked",
        "disabled",
        "value",
        "href",
        "src",
        "alt",
        "tabIndex",
        "accessKey",
        "hidden",
        "dataset",
        "contentEditable",
        "draggable",
        "spellcheck",
        "translate",
        "offsetHeight",
        "offsetWidth",
        "offsetLeft",
        "offsetTop",
        // Navigation properties
        "parentNode",
        "parentElement",
        "nextSibling",
        "previousSibling",
        "nextElementSibling",
        "previousElementSibling",
        "childElementCount",
        // Measurement properties
        "clientWidth",
        "clientHeight",
        "clientLeft",
        "clientTop",
        "scrollWidth",
        "scrollHeight",
        "scrollLeft",
        "scrollTop",
        // Form properties
        "form",
        "formAction",
        "formMethod",
        "formEnctype",
        "formNoValidate",
        "formTarget",
        "validity",
        "validationMessage",
        "willValidate",
        "required",
        "readOnly",
        "autofocus",
        "defaultValue",
        "selectedIndex",
        "options",
        "length",
        "selectedOptions",
        "selected",
        "defaultChecked",
        // Media properties
        "currentTime",
        "duration",
        "paused",
        "ended",
        "muted",
        "volume",
        "loop",
        "controls",
        "autoplay",
        "poster",
      ];

      if (domProperties.includes(prop)) {
        return function (value) {
          const elements = this._getElements();
          if (!elements) return this;

          // Getter mode
          if (value === undefined) {
            if (elements instanceof Element) {
              return elements[prop];
            } else if (
              elements instanceof NodeList ||
              elements instanceof HTMLCollection
            ) {
              if (elements.length > 0) {
                return elements[0][prop];
              }
            }
            return null;
          }

          // Setter mode
          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i][prop] = value;
            }
          } else if (elements instanceof Element) {
            elements[prop] = value;
          }

          return this;
        };
      }

      // 5. Check if it's a DOM method
      const domMethods = {
        // Element methods
        focus: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.focus();
          }
          return this;
        },
        blur: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.blur();
          }
          return this;
        },
        click: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.click();
          }
          return this;
        },
        scrollIntoView: function (options) {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.scrollIntoView(options);
          }
          return this;
        },
        matches: function (selector) {
          const elements = this._getElements();
          if (!elements) return false;

          if (elements instanceof Element) {
            return elements.matches(selector);
          }
          return false;
        },
        closest: function (selector) {
          const elements = this._getElements();
          if (!elements) return null;

          if (elements instanceof Element) {
            return elements.closest(selector);
          }
          return this;
        },
        // Form methods
        checkValidity: function () {
          const elements = this._getElements();
          if (!elements) return false;

          if (elements instanceof HTMLFormElement) {
            return elements.checkValidity();
          }

          return false;
        },
        reportValidity: function () {
          const elements = this._getElements();
          if (!elements) return false;

          if (elements instanceof HTMLFormElement) {
            return elements.reportValidity();
          }

          return false;
        },
        submit: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof HTMLFormElement) {
            elements.submit();
          }

          return this;
        },
        reset: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof HTMLFormElement) {
            elements.reset();
          }

          return this;
        },
        // Media methods
        play: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof HTMLMediaElement) {
            elements.play();
          }

          return this;
        },
        pause: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof HTMLMediaElement) {
            elements.pause();
          }

          return this;
        },
        load: function () {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof HTMLMediaElement) {
            elements.load();
          }

          return this;
        },
        // Canvas methods
        getContext: function (contextId) {
          const elements = this._getElements();
          if (!elements) return null;

          if (elements instanceof HTMLCanvasElement) {
            return elements.getContext(contextId);
          }

          return null;
        },
        toDataURL: function (type, quality) {
          const elements = this._getElements();
          if (!elements) return null;

          if (elements instanceof HTMLCanvasElement) {
            return elements.toDataURL(type, quality);
          }

          return null;
        },
        // Scroll methods
        scrollTo: function (x, y) {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.scrollTo(x, y);
          }

          return this;
        },
        scrollBy: function (x, y) {
          const elements = this._getElements();
          if (!elements) return this;

          if (elements instanceof Element) {
            elements.scrollBy(x, y);
          }

          return this;
        },
        // ClassList methods
        toggleClass: function (className, force) {
          const elements = this._getElements();
          if (!elements) return this;

          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i].classList.toggle(className, force);
            }
          } else if (elements instanceof Element) {
            elements.classList.toggle(className, force);
          }

          return this;
        },
        containsClass: function (className) {
          const elements = this._getElements();
          if (!elements) return false;

          if (elements instanceof Element) {
            return elements.classList.contains(className);
          }

          return false;
        },
        replaceClass: function (oldClass, newClass) {
          const elements = this._getElements();
          if (!elements) return this;

          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i].classList.replace(oldClass, newClass);
            }
          } else if (elements instanceof Element) {
            elements.classList.replace(oldClass, newClass);
          }

          return this;
        },
        // Attribute methods
        getAttribute: function (name) {
          const elements = this._getElements();
          if (!elements) return null;

          if (elements instanceof Element) {
            return elements.getAttribute(name);
          } else if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            if (elements.length > 0) {
              return elements[0].getAttribute(name);
            }
          }

          return null;
        },
        setAttribute: function (name, value) {
          const elements = this._getElements();
          if (!elements) return this;

          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i].setAttribute(name, value);
            }
          } else if (elements instanceof Element) {
            elements.setAttribute(name, value);
          }

          return this;
        },
        removeAttribute: function (name) {
          const elements = this._getElements();
          if (!elements) return this;

          if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            for (let i = 0; i < elements.length; i++) {
              elements[i].removeAttribute(name);
            }
          } else if (elements instanceof Element) {
            elements.removeAttribute(name);
          }

          return this;
        },
        hasAttribute: function (name) {
          const elements = this._getElements();
          if (!elements) return false;

          if (elements instanceof Element) {
            return elements.hasAttribute(name);
          } else if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            if (elements.length > 0) {
              return elements[0].hasAttribute(name);
            }
          }

          return false;
        },
        // Geometry/measurement methods
        getBoundingClientRect: function () {
          const elements = this._getElements();
          if (!elements) return null;

          if (elements instanceof Element) {
            return elements.getBoundingClientRect();
          } else if (
            elements instanceof NodeList ||
            elements instanceof HTMLCollection
          ) {
            if (elements.length > 0) {
              return elements[0].getBoundingClientRect();
            }
          }

          return null;
        },
      };

      if (prop in domMethods) {
        return domMethods[prop];
      }

      // 6. DEBUG MODE warnings
      if (
        domMan.debugMode &&
        typeof prop === "string" &&
        !prop.startsWith("_")
      ) {
        console.warn(
          `domMan: Attempting to access undefined property '${prop}'`
        );
      }
      
      // 7. Default behavior
      return Reflect.get(target, prop, receiver);
    },
  });
  // end of proxy test
  // Ensure the init function's prototype is domMan's prototype
  domMan.pt.init.prototype = domMan.pt;

  // ---- AMD & Global Setup ----
  if (typeof define === "function" && define.amd) {
    define("domMan", [], function () {
      return domMan;
    });
  }

  if (typeof noGlobal === "undefined") {
    window.domMan = window.$d = domMan;
  }
  var _domMan = window.domMan,
    _$d = window.$d;

  return domMan;
  //--------------------------End of domMan--------------------------
});
// ---- End of UMD ----
// ---- domMan no conflict and deep clone methods for fallback ----
domMan.noConflict = function (deep) {
  // Always restore window.$d if it was overwritten by domMan
  if (window.$d === domMan) {
    window.$d = _$d;
  }

  // Always restore window.domMan
  if (window.domMan === domMan) {
    window.domMan = _domMan;
  }

  if (deep) {
    // Create a completely isolated copy of domMan
    var clonedDomMan = function (selector) {
      return new clonedDomMan.pt.init(selector);
    };

    // Deep clone the prototype
    clonedDomMan.pt = clonedDomMan.prototype = domMan.deepClone(domMan.pt);

    // Fix constructor reference
    clonedDomMan.pt.constructor = clonedDomMan;

    // Clone the initialization function
    var clonedInit = function (selector) {
      if (!selector) return this;

      if (
        selector instanceof Node ||
        selector instanceof NodeList ||
        selector instanceof HTMLCollection
      ) {
        this.elements = selector;
      } else if (Array.isArray(selector) && selector[0] instanceof Element) {
        this.elements = selector;
      } else if (typeof selector === "string") {
        const elements = document.querySelectorAll(selector);
        this.elements = elements.length === 1 ? elements[0] : elements;
      } else if (selector instanceof domMan) {
        this.elements = selector.elements;
      } else {
        this.elements = [];
      }

      return this;
    };

    // Set up the init function
    clonedDomMan.pt.init = clonedInit;
    clonedInit.prototype = clonedDomMan.pt;

    // Copy utility methods directly to the cloned object
    clonedDomMan.isElement = domMan.isElement;
    clonedDomMan.ready = domMan.ready;
    clonedDomMan.deepClone = domMan.deepClone;

    return clonedDomMan;
  }

  return domMan;
};
domMan.deepClone = function (obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Node) {
    return obj.cloneNode(true);
  }

  if (Array.isArray(obj)) {
    const arrCopy = [];
    obj.forEach((item, index) => {
      arrCopy[index] = this.deepClone(item);
    });
    return arrCopy;
  }

  if (obj instanceof Object) {
    const objCopy = {};
    Object.keys(obj).forEach((key) => {
      objCopy[key] = this.deepClone(obj[key]);
    });
    return objCopy;
  }

  throw new Error("Unable to copy object! Its type isn't supported.");
};
