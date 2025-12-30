/**
 * domMan - A lightweight jQuery-like DOM manipulation library
 * Version: 1.0.1
 * Author: Ali Borsan
 * Authors Email: aliborsan@gmail.com
 * Licence: ISC
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

  // Private store for hover() handler refs so removeHover() can work
  const hoverHandlers = new WeakMap();

  // Private store for delegated event handler wrappers so off(evt, selector, fn) can work
  // rootEl -> Map<eventType, Map<selector, Map<namespace, Map<originalFn, Map<key, wrapperFn>>>>>
  const delegatedHandlers = new WeakMap();

  // Used only to decide whether we should interpret "click.menu" as a namespace.
  // If the base event isn't recognized, we keep the full name (supports custom events like "hello.world").
  const domEventNames = new Set([
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
    "pointerdown",
    "pointerup",
    "pointermove",
    "pointerenter",
    "pointerleave",
    "touchstart",
    "touchend",
    "touchmove",
  ]);

  /**
   * Parse an event string that may include a namespace suffix.
   *
   * Supported forms:
   * - "click" => { type: "click", namespace: "" }
   * - "click.menu" => { type: "click", namespace: "menu" } (only if base is a known DOM event)
   * - ".menu" => { type: "", namespace: "menu" } (namespace-only, used by off('.menu'))
   *
   * Custom events containing dots (e.g. "hello.world") are preserved as-is:
   * parseNamespacedEvent("hello.world") => { type: "hello.world", namespace: "" }
   *
   * @param {string} evt
   * @returns {{ type: string, namespace: string }}
   */
  function parseNamespacedEvent(evt) {
    if (typeof evt !== "string") return { type: evt, namespace: "" };

    // Namespace-only form: ".menu"
    if (evt.startsWith(".") && evt.length > 1) {
      return { type: "", namespace: evt.slice(1) };
    }

    const dotIndex = evt.indexOf(".");
    if (dotIndex === -1) return { type: evt, namespace: "" };

    const base = evt.slice(0, dotIndex);
    const ns = evt.slice(dotIndex + 1);
    if (!base || !ns) return { type: evt, namespace: "" };

    // Only treat it as namespaced if the base looks like a real DOM event.
    if (!domEventNames.has(base)) {
      return { type: evt, namespace: "" };
    }

    return { type: base, namespace: ns };
  }

  // Normalize various element containers to a plain array of Elements
  function toElementArray(input) {
    if (!input) return [];

    if (input instanceof Element) return [input];

    if (input instanceof NodeList || input instanceof HTMLCollection) {
      return Array.from(input).filter((n) => n instanceof Element);
    }

    if (Array.isArray(input)) {
      return input.filter((n) => n instanceof Element);
    }

    return [];
  }

  // Detect domMan instances reliably even when domMan.pt is wrapped in a Proxy.
  // Proxy-wrapping breaks `instanceof domMan` because domMan.prototype and domMan.pt diverge.
  function isDomManInstance(obj) {
    return (
      !!obj &&
      typeof obj === "object" &&
      typeof obj._getElements === "function" &&
      typeof obj._getElementArray === "function" &&
      typeof obj._getFirstElement === "function"
    );
  }

  var domMan = function (selector) {
    // The domMan object is actually just the init constructor 'enhanced'
    return new domMan.pt.init(selector);
  };

  // Named validation patterns used by validate()/applyValidationAttributes when
  // a rule uses `pattern: "email"` (or similar). Kept small and overridable.
  domMan.validationPatterns = domMan.validationPatterns || {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i,
    tel: /^[+()\d\s.-]{6,}$/,
  };

  function debugWarn() {
    if (!domMan.debugMode) return;
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn.apply(console, arguments);
    }
  }

  function debugError() {
    if (!domMan.debugMode) return;
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error.apply(console, arguments);
    }
  }

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

    /**
     * Initialize a domMan wrapper.
     *
     * Accepts:
     * - CSS selector string
     * - Element
     * - NodeList / HTMLCollection
     * - Array of Elements
     * - Another domMan instance
     *
     * @param {string|Node|NodeList|HTMLCollection|Element[]|Object} selector
     * @returns {Object} domMan object for chaining
     */
    init: function (selector) {
      if (!selector) {
        this.elements = [];
        this.length = 0;
        return this;
      }

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
      } else if (isDomManInstance(selector)) {
        this.elements = selector._getElements();
      } else {
        this.elements = [];
      }

      // jQuery-like count of matched Elements
      this.length = toElementArray(this.elements).length;

      return this;
    },

    /**
     * Internal: return the raw stored selection container.
     * This may be a single Element, a NodeList/HTMLCollection, an array, or empty.
     * @returns {*}
     */
    _getElements: function () {
      return this.elements || [];
    },

    /**
     * Internal: normalize the current selection to a plain array of Elements.
     * @returns {Element[]}
     */
    _getElementArray: function () {
      return toElementArray(this._getElements());
    },

    /**
     * Internal: get the first matched Element (or null).
     * @returns {Element|null}
     */
    _getFirstElement: function () {
      const arr = this._getElementArray();
      return arr.length ? arr[0] : null;
    },
    // ---- Dimension Methods ----

    // ---- Content Methods ----

    /**
     * Get or set the value of an input element
     * @param {string} [value] - Value to set
     * @returns {(string|Object)} Current value or domMan object for chaining
     */
    val: function (value) {
      const arr = this._getElementArray();

      if (value !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].value = value;
        }
        return this;
      }

      const first = arr[0];
      return first ? first.value : undefined;
    },

    /**
     * Get or set the text content of an element
     * @param {string} [text] - Text content to set
     * @returns {(string|Object)} Current text or domMan object for chaining
     */
    textContent: function (text) {
      const arr = this._getElementArray();

      if (text !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].textContent = text;
        }
        return this;
      }

      const first = arr[0];
      return first ? first.textContent : undefined;
    },
    /**
     * Get or set the outer HTML of an element
     * @param {string} [html] - HTML to set
     * @returns {(string|Object)} Current outerHTML or domMan object for chaining
     */
    outerHTML: function (html) {
      const arr = this._getElementArray();

      if (html !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].outerHTML = html;
        }
        return this;
      }

      const first = arr[0];
      return first ? first.outerHTML : undefined;
    },

    /**
     * Get or set the inner HTML of an element
     * @param {string} [html] - HTML to set
     * @returns {(string|Object)} Current HTML or domMan object for chaining
     */
    html: function (html) {
      const arr = this._getElementArray();

      if (html !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].innerHTML = html;
        }
        return this;
      }

      const first = arr[0];
      return first ? first.innerHTML : undefined;
    },

    /**
     * Get or set the text content of an element
     * @param {string} [t] - Text to set
     * @returns {(string|Object)} Current text or domMan object for chaining
     */
    text: function (t) {
      const arr = this._getElementArray();

      if (t !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].innerText = t;
        }
        return this;
      }

      const first = arr[0];
      return first ? first.innerText : undefined;
    },

    /**
     * Remove element from the DOM
     * @returns {Object} domMan object for chaining
     */
    remove: function () {
      const elements = isDomManInstance(this) ? this._getElements() : this;

      if (domMan.debugMode) {
        // console.log(elements);
      }

      const arr = toElementArray(elements);
      for (let i = 0; i < arr.length; i++) {
        arr[i].remove();
      }
      return this;
    },

    /**
     * Clone an element
     * @param {boolean} deep - Whether to deep clone
     * @returns {Node} Cloned node
     */
    clone: function (deep) {
      const elements = isDomManInstance(this) ? this._getElements() : this;
      const arr = toElementArray(elements);
      if (!arr.length) return null;

      if (arr.length === 1) {
        return arr[0].cloneNode(deep);
      }

      const clonedElements = [];
      for (let i = 0; i < arr.length; i++) {
        clonedElements.push(arr[i].cloneNode(deep));
      }
      return clonedElements;
    },

    /**
     * Replace element with another element
     * @param {Node} newelements - New element to replace with
     * @returns {Object} domMan object for chaining
     */
    replaceWith: function (newelements) {
      const arr = this._getElementArray();
      if (!arr.length || !newelements) return this;

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (!el.parentNode) continue;

        const replacement =
          newelements instanceof Node
            ? i === 0
              ? newelements
              : newelements.cloneNode(true)
            : newelements;

        el.parentNode.replaceChild(replacement, el);
      }
      return this;
    },
    /**
     * Append content to element
     * @param {Node|Object} ctn - Content to append
     * @returns {Object} domMan object for chaining
     */
    append: function (ctn) {
      if (!ctn) return this;

      const targets = this._getElementArray();
      if (!targets.length) return this;

      const appendOne = (target, node, targetIndex) => {
        if (!(target instanceof Element)) return;
        if (node instanceof Node) {
          target.append(targetIndex === 0 ? node : node.cloneNode(true));
        } else {
          target.append(node);
        }
      };

      if (Array.isArray(ctn)) {
        for (let t = 0; t < targets.length; t++) {
          for (let j = 0; j < ctn.length; j++) {
            appendOne(targets[t], ctn[j], t);
          }
        }
      } else {
        for (let t = 0; t < targets.length; t++) {
          appendOne(targets[t], ctn, t);
        }
      }

      return this;
    },
    /**
     * Prepend content to element(s).
     *
     * If multiple target elements are matched, the node(s) will be cloned
     * as needed so each target receives a copy.
     *
     * @param {Node|string|Object|Array} ctn - Content to prepend
     * @returns {Object} domMan object for chaining
     */
    pre: function (ctn) {
      if (!ctn) return this;

      const targets = this._getElementArray();
      if (!targets.length) return this;

      const prependOne = (target, node, targetIndex) => {
        if (!(target instanceof Element)) return;
        if (node instanceof Node) {
          target.prepend(targetIndex === 0 ? node : node.cloneNode(true));
        } else {
          target.prepend(node);
        }
      };

      if (Array.isArray(ctn)) {
        for (let t = 0; t < targets.length; t++) {
          for (let j = ctn.length - 1; j >= 0; j--) {
            prependOne(targets[t], ctn[j], t);
          }
        }
      } else {
        for (let t = 0; t < targets.length; t++) {
          prependOne(targets[t], ctn, t);
        }
      }

      return this;
    },

    /**
     * Prepend the current element(s) to the target element(s).
     *
     * When multiple targets exist, source nodes are cloned as needed so every
     * target receives the content.
     *
     * @param {Element|NodeList|HTMLCollection|Element[]|Object} target - Target container(s)
     * @returns {Object} domMan object for chaining
     */
    prependTo: function (target) {
      const sources = toElementArray(
        isDomManInstance(this) ? this._getElements() : this
      );
      const targets = toElementArray(
        isDomManInstance(target) ? target._getElements() : target
      );

      if (!targets.length || !sources.length) return this;

      for (let ti = 0; ti < targets.length; ti++) {
        for (let si = sources.length - 1; si >= 0; si--) {
          const node =
            ti === 0 ? sources[si] : sources[si].cloneNode(true);
          targets[ti].prepend(node);
        }
      }
      return this;
    },

    /**
     * Append the current element(s) to the target element(s).
     *
     * When multiple targets exist, source nodes are cloned as needed so every
     * target receives the content.
     *
     * @param {Element|NodeList|HTMLCollection|Element[]|Object} target - Target container(s)
     * @returns {Object} domMan object for chaining
     */
    appendTo: function (target) {
      const sources = toElementArray(
        isDomManInstance(this) ? this._getElements() : this
      );
      const targets = toElementArray(
        isDomManInstance(target) ? target._getElements() : target
      );

      if (!targets.length || !sources.length) return this;

      for (let ti = 0; ti < targets.length; ti++) {
        for (let si = 0; si < sources.length; si++) {
          const node =
            ti === 0 ? sources[si] : sources[si].cloneNode(true);
          targets[ti].appendChild(node);
        }
      }
      return this;
    },
    /**
     * Hide an element
     * @returns {Object} domMan object for chaining
     */
    hide: function () {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].style.display = "none";
      }

      return this;
    },
    // ---- Style Methods ----

    /**
     * Set CSS property
     * @param {string} prop - CSS property
     * @param {string} value - CSS value
     * @returns {Object} domMan object for chaining
     */
    css: function (prop, value) {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].style[prop] = value;
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

      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        for (const [key, value] of Object.entries(ob)) {
          arr[i].style.setProperty(key, value);
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
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].classList.add(className);
      }
      return this;
    },
    /**
     * Remove a class from element
     * @param {string} className - Class to remove
     * @returns {Object} domMan object for chaining
     */
    removeClass: function (className) {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].classList.remove(className);
      }
      return this;
    },
    /**
     * Toggle a class on element
     * @param {string} className - Class to toggle
     * @returns {Object} domMan object for chaining
     */
    toggleClass: function (className) {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].classList.toggle(className);
      }
      return this;
    },
    /**
     * Check if element has a class
     * @param {string} className - Class to check
     * @returns {boolean} True if element has the class
     */
    hasClass: function (className) {
      const first = this._getFirstElement();
      return !!(first && first.classList.contains(className));
    },
    // ---- Event Methods ----

    /**
     * Execute a callback when DOM is ready.
     * @param {Function} callback - Function to execute
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
     * Add event listener(s) to all matched elements.
     *
     * Overloads:
     * - on(evt, handler, options?)
     * - on(evt, selector, handler, options?)  (delegated)
     *
     * Namespaces:
     * - For known DOM events, you can use "click.menu" to tag handlers.
     * - Namespace-only strings like ".menu" are ignored here (use off('.menu') to remove).
     * - Custom event names containing dots (e.g. "hello.world") are kept intact.
     *
     * @param {string} evt Event type, possibly with namespace (e.g. "click.menu")
     * @param {string|Function|EventListenerObject} selectorOrHandler
     * @param {Function|boolean|AddEventListenerOptions} [handlerOrOptions]
     * @param {boolean|AddEventListenerOptions} [options]
     * @returns {Object} domMan object for chaining
     */
    on: function (evt, selectorOrHandler, handlerOrOptions, options) {
      if (!evt) return this;

      const parsedEvt = parseNamespacedEvent(evt);
      const eventType = parsedEvt.type;
      const namespace = parsedEvt.namespace || "";

      // Namespace-only is only meaningful for off('.ns')
      if (!eventType && namespace) return this;

      const resolvedEventType = eventType || evt;

      const arr = this._getElementArray();
      if (!arr.length) return this;

      // on(evt, handler, options?)
      if (typeof selectorOrHandler === "function") {
        const fn = selectorOrHandler;
        const opts = handlerOrOptions;
        for (let i = 0; i < arr.length; i++) {
          arr[i].addEventListener(resolvedEventType, fn, opts);
        }
        return this;
      }

      // on(evt, selector, handler, options?) (delegation)
      if (
        typeof selectorOrHandler === "string" &&
        typeof handlerOrOptions === "function"
      ) {
        const selector = selectorOrHandler;
        const fn = handlerOrOptions;
        const opts = options;

        const capture = (() => {
          if (opts === true) return true;
          if (opts === false || opts == null) return false;
          if (typeof opts === "boolean") return opts;
          return !!opts.capture;
        })();

        const once = (() => {
          if (!opts || typeof opts === "boolean") return false;
          return !!opts.once;
        })();

        for (let i = 0; i < arr.length; i++) {
          const rootEl = arr[i];

          let byEvent = delegatedHandlers.get(rootEl);
          if (!byEvent) {
            byEvent = new Map();
            delegatedHandlers.set(rootEl, byEvent);
          }

          let bySelector = byEvent.get(resolvedEventType);
          if (!bySelector) {
            bySelector = new Map();
            byEvent.set(resolvedEventType, bySelector);
          }

          let byNamespace = bySelector.get(selector);
          if (!byNamespace) {
            byNamespace = new Map();
            bySelector.set(selector, byNamespace);
          }

          const nsKey = namespace;
          let byFn = byNamespace.get(nsKey);
          if (!byFn) {
            byFn = new Map();
            byNamespace.set(nsKey, byFn);
          }

          let byCapture = byFn.get(fn);
          if (!byCapture) {
            byCapture = new Map();
            byFn.set(fn, byCapture);
          }

          const key = `${capture ? 1 : 0}:${once ? 1 : 0}`;

          let delegatedHandler = byCapture.get(key);
          if (!delegatedHandler) {
            delegatedHandler = function (e) {
              const root = this;
              const rawTarget = e && e.target;
              if (!rawTarget || !(rawTarget instanceof Element)) return;

              const matched = rawTarget.closest
                ? rawTarget.closest(selector)
                : null;
              if (!matched) return;

              if (
                root === matched ||
                (root instanceof Element && root.contains(matched))
              ) {
                fn.call(matched, e, matched);

                // If registered as once, clean up our bookkeeping after first run.
                if (once) {
                  try {
                    const _byEvent = delegatedHandlers.get(rootEl);
                    const _bySelector = _byEvent && _byEvent.get(eventType);
                    const _byNamespace = _bySelector && _bySelector.get(selector);
                    const _byFn = _byNamespace && _byNamespace.get(nsKey);
                    const _byCapture = _byFn && _byFn.get(fn);
                    if (_byCapture) {
                      _byCapture.delete(key);
                      if (_byCapture.size === 0) _byFn.delete(fn);
                      if (_byFn.size === 0) _byNamespace.delete(nsKey);
                      if (_byNamespace.size === 0) _bySelector.delete(selector);
                      if (_bySelector.size === 0) _byEvent.delete(eventType);
                      if (_byEvent.size === 0) delegatedHandlers.delete(rootEl);
                    }
                  } catch (e) {
                    // ignore
                  }
                }
              }
            };

            byCapture.set(key, delegatedHandler);
          }

          rootEl.addEventListener(resolvedEventType, delegatedHandler, opts);
        }

        return this;
      }

      return this;
    },

    /**
     * Add an event listener that runs at most once.
     * Supports the same overloads as on().
     *
     * @param {string} evt
     * @param {string|Function|EventListenerObject} selectorOrHandler
     * @param {Function|boolean|AddEventListenerOptions} [handlerOrOptions]
     * @param {boolean|AddEventListenerOptions} [options]
     * @returns {Object} domMan object for chaining
     */
    one: function (evt, selectorOrHandler, handlerOrOptions, options) {
      // one(evt, handler, options?)
      if (typeof selectorOrHandler === "function") {
        const opts = (() => {
          if (handlerOrOptions === true) return { capture: true, once: true };
          if (handlerOrOptions === false || handlerOrOptions == null)
            return { once: true };
          if (typeof handlerOrOptions === "boolean")
            return { capture: handlerOrOptions, once: true };
          return Object.assign({}, handlerOrOptions, { once: true });
        })();
        return this.on(evt, selectorOrHandler, opts);
      }

      // one(evt, selector, handler, options?)
      if (
        typeof selectorOrHandler === "string" &&
        typeof handlerOrOptions === "function"
      ) {
        const opts = (() => {
          if (options === true) return { capture: true, once: true };
          if (options === false || options == null) return { once: true };
          if (typeof options === "boolean") return { capture: options, once: true };
          return Object.assign({}, options, { once: true });
        })();
        return this.on(evt, selectorOrHandler, handlerOrOptions, opts);
      }

      return this;
    },

    /**
     * Dispatch an event on all matched elements.
     * @param {string} evt - Event name
     * @param {*} [detail] - CustomEvent detail
     * @param {Object} [eventInit] - Event init options (bubbles/cancelable/composed)
     * @returns {Object} domMan object for chaining
     */
    trigger: function (evt, detail, eventInit) {
      if (!evt) return this;

      const arr = this._getElementArray();
      if (!arr.length) return this;

      const init = Object.assign(
        { bubbles: true, cancelable: true },
        eventInit && typeof eventInit === "object" ? eventInit : {}
      );

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        let ev;

        if (detail !== undefined) {
          if (typeof CustomEvent === "function") {
            ev = new CustomEvent(evt, Object.assign({}, init, { detail }));
          } else {
            ev = new Event(evt, init);
            ev.detail = detail;
          }
        } else {
          ev = new Event(evt, init);
        }

        el.dispatchEvent(ev);
      }

      return this;
    },

    /**
     * Dispatch an event only on the first matched element, without bubbling.
     * Intended as a convenience similar to jQuery's triggerHandler().
     * @param {string} evt
     * @param {*} [detail]
     * @param {Object} [eventInit]
     * @returns {Object} domMan object for chaining
     */
    triggerHandler: function (evt, detail, eventInit) {
      if (!evt) return this;

      const first = this._getFirstElement();
      if (!first) return this;

      const init = Object.assign(
        { bubbles: false, cancelable: true },
        eventInit && typeof eventInit === "object" ? eventInit : {}
      );

      let ev;
      if (detail !== undefined) {
        if (typeof CustomEvent === "function") {
          ev = new CustomEvent(evt, Object.assign({}, init, { detail }));
        } else {
          ev = new Event(evt, init);
          ev.detail = detail;
        }
      } else {
        ev = new Event(evt, init);
      }

      first.dispatchEvent(ev);
      return this;
    },
    // ---- Attribute Methods ----
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

      const first = this._getFirstElement();
      if (first instanceof HTMLTableElement) {
        rows = first.rows;
      } else if (first instanceof HTMLTableSectionElement) {
        rows = first.rows;
      } else if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        rows = elements;
      } else if (Array.isArray(elements)) {
        rows = elements;
      } else {
        debugWarn(
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
     * Create a new DOM element.
     *
     * Note: this returns a raw Element (not a domMan instance).
     *
     * @param {string} e - Element tag name
     * @param {Object} [attributes] - Attributes to set
     * @returns {Element|null} The created element, or null on error
     */
    createElement: function (e, attributes) {
      if (!e || typeof e !== "string") {
        debugError("Element type must be a valid string");
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
        debugError("Error creating element:", error);
        return null;
      }
    },
    /**
     * Deep clone common JS/DOM values.
     *
     * Supported:
     * - primitives/null
     * - Date
     * - Node (cloneNode(true))
     * - Array
     * - plain Objects
     *
     * @param {*} obj
     * @returns {*}
     */
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
      const first = this._getFirstElement();
      if (!first || !selector) return this;

      return $d(first.querySelectorAll(selector));
    },

    /**
     * Find the first matching element within the first matched element.
     * @param {string} selector - CSS selector
     * @returns {Object} domMan object wrapping the found element (or empty)
     */
    findOne: function (selector) {
      const first = this._getFirstElement();
      if (!first || !selector) return $d();

      const found = first.querySelector(selector);
      return found ? $d(found) : $d();
    },

    /**
     * Run a function during a chain and return the original instance.
     * @param {Function} fn
     * @returns {Object} domMan object for chaining
     */
    tap: function (fn) {
      if (typeof fn === "function") {
        fn.call(this, this, this._getElementArray());
      }
      return this;
    },

    /**
     * Get the current selection as a plain array of Elements.
     * @returns {Element[]}
     */
    toArray: function () {
      return this._getElementArray().slice();
    },

    /**
     * Alias of toArray().
     * @returns {Element[]}
     */
    asArray: function () {
      return this.toArray();
    },
    /**
     * Execute a callback for each element
     * @param {Function} callback - Function to execute
     * @returns {Object} domMan object for chaining
     */
    each: function (callback) {
      if (typeof callback !== "function") return this;

      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        callback.call(arr[i], i, arr[i]);
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

    /**
     * Restore any previous globals and optionally return an isolated clone.
     *
     * - Always restores `window.$d` and `window.domMan` if this library overwrote them.
     * - If `deep === true`, returns a cloned domMan function with a deep-cloned prototype.
     *
     * @param {boolean} [deep]
     * @returns {Function} domMan (or a cloned domMan when deep=true)
     */
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
          if (!selector) {
            this.elements = [];
            this.length = 0;
            return this;
          }

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
          } else if (isDomManInstance(selector)) {
            this.elements = selector._getElements();
          } else {
            this.elements = [];
          }

          // jQuery-like count of matched Elements
          this.length = toElementArray(this.elements).length;

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
      const delegatedHandler = function (e) {
        if (typeof handler !== "function") return;

        // `this` is the element the listener was bound to via `.on()`
        const root = this;
        const rawTarget = e && e.target;
        const elementTarget =
          rawTarget && rawTarget.nodeType === 1
            ? rawTarget
            : rawTarget && rawTarget.parentElement
            ? rawTarget.parentElement
            : null;

        if (!elementTarget || !elementTarget.closest) return;

        const match = elementTarget.closest(selector);
        if (match && root && root.contains && root.contains(match)) {
          handler.call(match, e);
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
      const arr = this._getElementArray();
      if (!arr.length) return this;

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        const existing = hoverHandlers.get(el) || {};

        if (typeof enterFn === "function") {
          if (typeof existing.enter === "function") {
            el.removeEventListener("mouseenter", existing.enter);
          }
          el.addEventListener("mouseenter", enterFn);
          existing.enter = enterFn;
        }

        if (typeof leaveFn === "function") {
          if (typeof existing.leave === "function") {
            el.removeEventListener("mouseleave", existing.leave);
          }
          el.addEventListener("mouseleave", leaveFn);
          existing.leave = leaveFn;
        }

        hoverHandlers.set(el, existing);
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
      const arr = this._getElementArray();
      if (!arr.length) return this;

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
      for (let i = 0; i < arr.length; i++) {
        arr[i].classList.add(uniqueClass);
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
      const arr = this._getElementArray();
      if (!arr.length) return this;

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        const stored = hoverHandlers.get(el);
        if (!stored) continue;

        if (typeof stored.enter === "function") {
          el.removeEventListener("mouseenter", stored.enter);
        }
        if (typeof stored.leave === "function") {
          el.removeEventListener("mouseleave", stored.leave);
        }

        hoverHandlers.delete(el);
      }

      return this;
    },
    /**
     * Remove CSS-based hover effects
     * @param {string} [uniqueClass] - Optional specific class to remove (if known)
     * @returns {Object} domMan object for chaining
     */
    removeCssHover: function (uniqueClass) {
      const arr = this._getElementArray();
      if (!arr.length) return this;

      if (uniqueClass) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].classList.remove(uniqueClass);
        }
        return this;
      }

      // If cssPseudo/cssHover stored the last class, remove it first (applies to all)
      const last = this.data("last-pseudo-class");
      if (typeof last === "string" && last) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].classList.remove(last);
        }
      }

      // Remove all domman hover/pseudo classes
      for (let i = 0; i < arr.length; i++) {
        const classes = Array.from(arr[i].classList);
        classes.forEach((cls) => {
          if (cls.startsWith("domman-hover-") || cls.startsWith("domman-pseudo-")) {
            arr[i].classList.remove(cls);
          }
        });
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
      const arr = this._getElementArray();
      const first = arr.length ? arr[0] : null;
      if (!first) return this;

      const normalizeVarName = (name) => {
        if (typeof name !== "string") return "";
        return name.startsWith("--") ? name : `--${name}`;
      };

      // Getter mode
      if (typeof varName === "string" && value === undefined) {
        return getComputedStyle(first)
          .getPropertyValue(normalizeVarName(varName))
          .trim();
      }

      // Setter mode - single variable
      if (typeof varName === "string" && value !== undefined) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].style.setProperty(normalizeVarName(varName), value);
        }
        return this;
      }

      // Setter mode - multiple variables
      if (typeof varName === "object") {
        for (let i = 0; i < arr.length; i++) {
          for (const [name, val] of Object.entries(varName)) {
            arr[i].style.setProperty(normalizeVarName(name), val);
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
      if (typeof IntersectionObserver === "undefined") {
        debugWarn("IntersectionObserver is not available in this environment");
        return this;
      }

      const arr = this._getElementArray();
      if (!arr.length) return this;

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
      for (let i = 0; i < arr.length; i++) {
        observer.observe(arr[i]);
      }

      // Store observer for potential cleanup
      if (!this._observers) this._observers = [];
      this._observers.push(observer);

      return this;
    },

    /**
     * Call a callback when the element becomes visible (isIntersecting).
     * By default runs once per element.
     * @param {Function} callback
     * @param {Object} [options]
     * @param {boolean} [options.once=true]
     * @returns {Object} Current object for chaining
     */
    whenVisible: function (callback, options = {}) {
      if (typeof IntersectionObserver === "undefined") {
        debugWarn("IntersectionObserver is not available in this environment");
        return this;
      }

      if (typeof callback !== "function") return this;

      const arr = this._getElementArray();
      if (!arr.length) return this;

      const once =
        options && typeof options.once === "boolean" ? options.once : true;

      const observerOptions = Object.assign(
        {
          root: null,
          rootMargin: "0px",
          threshold: 0,
        },
        options
      );
      delete observerOptions.once;

      let remaining = arr.length;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          callback.call(entry.target, entry, entry.target);

          if (once) {
            observer.unobserve(entry.target);
            remaining -= 1;
            if (remaining <= 0) observer.disconnect();
          }
        });
      }, observerOptions);

      for (let i = 0; i < arr.length; i++) {
        observer.observe(arr[i]);
      }

      if (!this._observers) this._observers = [];
      this._observers.push(observer);

      return this;
    },

    /**
     * Stop observing element visibility
     * @returns {Object} Current object for chaining
     */
    unobserve: function () {
      if (!this._observers) return this;

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
      if (typeof ResizeObserver === "undefined") {
        debugWarn("ResizeObserver is not available in this environment");
        return this;
      }

      const arr = this._getElementArray();
      if (!arr.length) return this;

      // Create observer
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          // Call the callback with the entry and target
          callback.call(entry.target, entry, entry.target);
        });
      });

      // Observe elements
      for (let i = 0; i < arr.length; i++) {
        observer.observe(arr[i]);
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
      if (!this._resizeObservers) return this;

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
      const arr = this._getElementArray();
      if (!arr.length) return this;

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

      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i].animate !== "function") continue;

        const animation = arr[i].animate(keyframes, animationOptions);

        if (options.onComplete && typeof options.onComplete === "function") {
          animation.onfinish = () => options.onComplete.call(arr[i], arr[i]);
        }

        if (options.onCancel && typeof options.onCancel === "function") {
          animation.oncancel = () => options.onCancel.call(arr[i], arr[i]);
        }

        this._animations.set(arr[i], animation);
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
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const ms = typeof duration === "number" && duration > 0 ? duration : 400;

      for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        element.style.opacity = 0;
        element.style.display = "block";

        let last = +new Date();
        const tick = function () {
          element.style.opacity =
            +element.style.opacity + (new Date() - last) / ms;
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
      }
      return this;
    },
    /*  
  
     Simple Animation Framework
  
    */
    // Base animation system
    animate: function (properties, duration = 400, easing = "ease", callback) {
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const ms = typeof duration === "number" && duration >= 0 ? duration : 400;

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        el.style.transition = `all ${ms}ms ${easing}`;

        for (const prop in properties) {
          if (Object.prototype.hasOwnProperty.call(properties, prop)) {
            el.style[prop] = properties[prop];
          }
        }

        if (typeof callback === "function") {
          let called = false;

          const done = () => {
            if (called) return;
            called = true;
            el.removeEventListener("transitionend", transitionEnd);
            callback.call(el);
          };

          const transitionEnd = (e) => {
            if (e && e.target !== el) return;
            done();
          };

          el.addEventListener("transitionend", transitionEnd);
          setTimeout(done, ms + 50);
        }
      }

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
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const first = arr[0];
      if (!elementData.has(first)) {
        elementData.set(first, {});
      }

      // Get all data (from first element)
      if (arguments.length === 0) {
        return elementData.get(first);
      }

      // Get specific data (from first element)
      if (arguments.length === 1) {
        return elementData.get(first)[key];
      }

      // Set data (on all matched elements)
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (!elementData.has(el)) {
          elementData.set(el, {});
        }
        elementData.get(el)[key] = value;
      }

      return this;
    },
    /**
     * Remove data from an element
     * @param {string} [key] - The data key to remove (or all if omitted)
     * @returns {Object} domMan object for chaining
     */
    removeData: function (key) {
      const arr = this._getElementArray();
      if (!arr.length) return this;

      // Remove all stored data for all matched elements
      if (arguments.length === 0) {
        for (let i = 0; i < arr.length; i++) {
          elementData.delete(arr[i]);
        }
        return this;
      }

      // Remove a single key for all matched elements
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (!elementData.has(el)) continue;
        delete elementData.get(el)[key];
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
        debugError("Invalid key for localStorage");
        return this;
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        debugError("Error setting localStorage:", e);
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
        debugError("Invalid key for localStorage");
        return null;
      }
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (e) {
        debugError("Error getting localStorage:", e);
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
        debugError("Invalid key for localStorage");
        return this;
      }
      try {
        localStorage.removeItem(key);
      } catch (e) {
        debugError("Error removing localStorage:", e);
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
        debugError("Error clearing localStorage:", e);
      }
      return this;
    },

    // ---- DOM Traversal Methods ----
    /**
     * Get unique parent elements for the current selection.
     *
     * - For multi-selection, returns the union of parents (duplicates removed).
     * - Returns an empty domMan selection when there are no matches.
     *
     * @returns {Object} domMan object wrapping parent element(s)
     */
    parent: function () {
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const parents = [];
      const seen = new Set();
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i].parentElement;
        if (p && !seen.has(p)) {
          seen.add(p);
          parents.push(p);
        }
      }

      return $d(parents);
    },
    /**
     * Get child elements of all matched elements.
     *
     * - For multi-selection, flattens children into a single list (order preserved).
     * - Does not de-duplicate.
     *
     * @returns {Object} domMan object wrapping child element(s)
     */
    children: function () {
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const kids = [];
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (!(el instanceof Element)) continue;

        const children = el.children;
        for (let j = 0; j < children.length; j++) {
          kids.push(children[j]);
        }
      }

      return $d(kids);
    },
    /**
     * Get unique sibling elements of the current selection.
     *
     * - Excludes the currently selected elements.
     * - For multi-selection, returns the union of siblings (duplicates removed).
     *
     * @returns {Object} domMan object wrapping sibling element(s)
     */
    siblings: function () {
      const arr = this._getElementArray();
      if (!arr.length) return $d([]);

      const selected = new Set(arr);
      const siblings = [];
      const seen = new Set();

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        const parent = el.parentElement;
        if (!parent) continue;

        const kids = parent.children;
        for (let j = 0; j < kids.length; j++) {
          const kid = kids[j];
          if (selected.has(kid)) continue;
          if (!seen.has(kid)) {
            seen.add(kid);
            siblings.push(kid);
          }
        }
      }

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

    /**
     * Convenience wrapper for ajax({ method: 'GET', ... }).
     * @param {string} url
     * @param {*} [data]
     * @param {Object} [options]
     * @returns {Promise}
     */
    get: function (url, data = null, options = {}) {
      const settings = Object.assign({}, options, {
        method: "GET",
        url: url,
        data: data,
      });
      return this.ajax(settings);
    },

    /**
     * Convenience wrapper for ajax({ method: 'POST', ... }).
     * @param {string} url
     * @param {*} [data]
     * @param {Object} [options]
     * @returns {Promise}
     */
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
     * @returns {Function} domMan function (for chaining extensions)
     */
    extend: function (methods) {
      const ctor =
        this && this.constructor && this.constructor.pt
          ? this.constructor
          : domMan;

      for (const name in methods) {
        if (methods.hasOwnProperty(name)) {
          // Don't override existing methods
          if (!ctor.pt[name]) {
            ctor.pt[name] = methods[name];
          } else {
            debugWarn(`Cannot extend domMan: Method '${name}' already exists.`);
          }
        }
      }
      return ctor;
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
      const arr = this._getElementArray();
      if (!arr.length) return this;

      const ms = typeof duration === "number" && duration >= 0 ? duration : 300;

      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];

        // Store original transition
        const originalTransition = el.style.transition;

        // Set transition duration
        el.style.transition = `all ${ms}ms`;

        // Force a reflow to ensure the transition takes effect
        void el.offsetWidth;

        // Add the class
        el.classList.add(className);

        // Reset transition after animation completes
        setTimeout(() => {
          el.style.transition = originalTransition;
        }, ms);
      }

      return this;
    },

    // ---- Form Data Handling ----
    /* Form Data Handling */

    /**
     * Serialize the first matched form's fields.
     *
     * Output formats:
     * - "object": plain object of key/value pairs (multi-value keys become arrays)
     * - "json": JSON string
     * - "urlencoded": query-string style key/value pairs
     *
     * @param {"object"|"json"|"urlencoded"} [format="object"]
     * @returns {Object|string} Serialized form data
     */
    serializeForm: function (format = "object") {
      const form = this._getFirstElement();
      if (!form || !(form instanceof HTMLFormElement)) {
        debugError("serializeForm requires a form element");
        return format === "object" ? {} : format === "json" ? "{}" : "";
      }

      const formData = new FormData(form);
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
     * Submit the first matched form.
     *
     * - If `ajax === false`, calls native `form.submit()`.
     * - If `ajax === true`, submits via XHR using `form.method` and `form.action`.
     *
     * Callback signature: `(status, responseText, xhr)`.
     *
     * @param {boolean} [ajax=false] - Use AJAX submission
     * @param {Function} [callback] - Invoked on load/error
     * @returns {Object} domMan object for chaining
     */
    submitForm: function (ajax = false, callback) {
      const form = this._getFirstElement();
      if (!form || !(form instanceof HTMLFormElement)) {
        debugError("submitForm requires a form element");
        return this;
      }

      if (!ajax) {
        form.submit();
        return this;
      }

      // AJAX submission
      const method = form.method.toUpperCase() || "GET";
      const url = form.action || window.location.href;
      const data = new FormData(form);

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
     * Reset the first matched form to its initial values.
     * @returns {Object} domMan object for chaining
     */
    resetForm: function () {
      const form = this._getFirstElement();
      if (!form || !(form instanceof HTMLFormElement)) {
        debugError("resetForm requires a form element");
        return this;
      }

      form.reset();
      return this;
    },
    /**
     * Get or set form field values (uses the first matched form/field).
     *
     * Getter:
     * - `formValue()` returns all form values (same as `serializeForm('object')`)
     * - `formValue(name)` returns that field's current value
     *
     * Setter:
     * - `formValue(name, value)` sets the field value and returns `this`
     *
     * @param {string} [name] - Field name
     * @param {*} [value] - Value to set
     * @returns {*|Object} Field value (getter) or domMan object (setter)
     */
    formValue: function (name, value) {
      const elements = this._getFirstElement();
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
     * Validate fields against rules.
     *
     * - Operates on the first matched form (or nearest form when invoked on a descendant).
     * - Can optionally mark fields and inject error message elements.
     *
     * Rules shape: `{ [fieldName]: { required?, pattern?, minLength?, maxLength?, min?, max?, validate?, message? } }`.
     *
     * Options:
     * - `showErrors` (boolean)
     * - `errorClass` (string)
     * - `errorMessageClass` (string)
     * - `validateOnBlur` (boolean)
     *
     * @param {Object} [rules]
     * @param {Object} [options]
     * @returns {{ valid: boolean, errors: Object }} Validation result
     */
    validate: function (rules = {}, options = {}) {
      const elements = this._getFirstElement();
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
     * Apply HTML5 validation-related attributes on the first matched form based on rules.
     * @param {Object} rules - Validation rules (same shape as validate())
     * @returns {Object} domMan object for chaining
     */
    applyValidationAttributes: function (rules) {
      const elements = this._getFirstElement();
      if (!elements || !(elements instanceof HTMLFormElement)) {
        debugError("applyValidationAttributes requires a form element");
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

    /**
     * Create a new DOM element.
     *
     * Note: returns a raw Element (not a domMan instance).
     * For namespaced elements, use createElementNS()/createSVG().
     *
     * @param {string} tagName
     * @param {Object} [attributes]
     * @returns {Element}
     */
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
     * Remove event listener(s) from all matched elements.
     *
     * Overloads:
     * - off(evt, handler, options?)
     * - off(evt, selector)                   (delegated: remove all for selector)
     * - off(evt, selector, handler, options?) (delegated: remove a specific handler)
     * - off(evt)                             (delegated: remove all delegated for event)
     * - off('.ns')                           (delegated: remove all delegated in namespace)
     *
     * Note: Direct listeners added with on(evt, fn) cannot be removed without the same function reference.
     *
     * @param {string} evt Event type, possibly with namespace (e.g. "click.menu") or namespace-only (e.g. ".menu")
     * @param {string|Function|EventListenerObject} [selectorOrHandler]
     * @param {Function|boolean|AddEventListenerOptions} [handlerOrOptions]
     * @param {boolean|AddEventListenerOptions} [options]
     * @returns {Object} domMan object for chaining
     */
    off: function (evt, selectorOrHandler, handlerOrOptions, options) {
      if (!evt) return this;

      const parsedEvt = parseNamespacedEvent(evt);
      const eventType = parsedEvt.type;
      const namespace = parsedEvt.namespace || "";
      const resolvedEventType = eventType || evt;

      const arr = this._getElementArray();
      if (!arr.length) return this;

      // off(evt): remove all delegated listeners registered via on/one for this event
      // (Direct listeners cannot be removed without a function reference.)
      if (selectorOrHandler === undefined) {
        // Namespace-only form: off('.menu')
        const namespaceOnly = !eventType && !!namespace;

        for (let i = 0; i < arr.length; i++) {
          const rootEl = arr[i];
          const byEvent = delegatedHandlers.get(rootEl);
          if (!byEvent) continue;

          const eventTypesToRemove = namespaceOnly
            ? Array.from(byEvent.keys())
            : [resolvedEventType];

          for (let ti = 0; ti < eventTypesToRemove.length; ti++) {
            const t = eventTypesToRemove[ti];
            const bySelector = byEvent.get(t);
            if (!bySelector) continue;

            for (const [selector, byNamespace] of bySelector.entries()) {
              const namespacesToRemove = namespaceOnly
                ? [namespace]
                : namespace
                  ? [namespace]
                  : Array.from(byNamespace.keys());

              for (let ni = 0; ni < namespacesToRemove.length; ni++) {
                const ns = namespacesToRemove[ni];
                const byFn = byNamespace.get(ns);
                if (!byFn) continue;

                for (const [fn, byCapture] of byFn.entries()) {
                  for (const [key, delegatedHandler] of byCapture.entries()) {
                    const capture = key.startsWith("1:");
                    rootEl.removeEventListener(t, delegatedHandler, capture);
                  }
                }

                byNamespace.delete(ns);
              }

              if (byNamespace.size === 0) bySelector.delete(selector);
            }

            if (bySelector.size === 0) byEvent.delete(t);
          }

          if (byEvent.size === 0) delegatedHandlers.delete(rootEl);
        }

        return this;
      }

      // off(evt, selector): remove all delegated listeners for selector+event
      if (
        typeof selectorOrHandler === "string" &&
        handlerOrOptions === undefined
      ) {
        const selector = selectorOrHandler;

        if (!eventType) return this;

        for (let i = 0; i < arr.length; i++) {
          const rootEl = arr[i];
          const byEvent = delegatedHandlers.get(rootEl);
          if (!byEvent) continue;

          const bySelector = byEvent.get(resolvedEventType);
          if (!bySelector) continue;

          const byNamespace = bySelector.get(selector);
          if (!byNamespace) continue;

          const namespacesToRemove = namespace
            ? [namespace]
            : Array.from(byNamespace.keys());

          for (let ni = 0; ni < namespacesToRemove.length; ni++) {
            const ns = namespacesToRemove[ni];
            const byFn = byNamespace.get(ns);
            if (!byFn) continue;

            for (const [fn, byCapture] of byFn.entries()) {
              for (const [key, delegatedHandler] of byCapture.entries()) {
                const capture = key.startsWith("1:");
                rootEl.removeEventListener(resolvedEventType, delegatedHandler, capture);
              }
            }
            byNamespace.delete(ns);
          }

          if (byNamespace.size === 0) bySelector.delete(selector);
          if (bySelector.size === 0) byEvent.delete(resolvedEventType);
          if (byEvent.size === 0) delegatedHandlers.delete(rootEl);
        }

        return this;
      }

      // off(evt, handler, options?)
      if (typeof selectorOrHandler === "function") {
        const fn = selectorOrHandler;
        const opts = handlerOrOptions;
        for (let i = 0; i < arr.length; i++) {
          arr[i].removeEventListener(resolvedEventType, fn, opts);
        }
        return this;
      }

      // off(evt, selector, handler, options?) (delegation)
      if (
        typeof selectorOrHandler === "string" &&
        typeof handlerOrOptions === "function"
      ) {
        const selector = selectorOrHandler;
        const fn = handlerOrOptions;
        const opts = options;
        if (!eventType) return this;

        const capture = (() => {
          if (opts === true) return true;
          if (opts === false || opts == null) return false;
          if (typeof opts === "boolean") return opts;
          return !!opts.capture;
        })();

        const onceSpecified =
          !!opts && typeof opts !== "boolean" && typeof opts.once === "boolean";
        const onceValues = onceSpecified ? [!!opts.once] : [false, true];

        const namespaceSpecified = !!namespace;

        for (let i = 0; i < arr.length; i++) {
          const rootEl = arr[i];
          const byEvent = delegatedHandlers.get(rootEl);
          if (!byEvent) continue;

          const bySelector = byEvent.get(resolvedEventType);
          if (!bySelector) continue;

          const byNamespace = bySelector.get(selector);
          if (!byNamespace) continue;

          const namespacesToRemove = namespaceSpecified
            ? [namespace]
            : Array.from(byNamespace.keys());

          for (let ni = 0; ni < namespacesToRemove.length; ni++) {
            const ns = namespacesToRemove[ni];
            const byFn = byNamespace.get(ns);
            if (!byFn) continue;

            const byCapture = byFn.get(fn);
            if (!byCapture) continue;

            for (let oi = 0; oi < onceValues.length; oi++) {
              const key = `${capture ? 1 : 0}:${onceValues[oi] ? 1 : 0}`;
              const delegatedHandler = byCapture.get(key);
              if (!delegatedHandler) continue;

              rootEl.removeEventListener(resolvedEventType, delegatedHandler, opts);

              byCapture.delete(key);
            }

            if (byCapture.size === 0) byFn.delete(fn);
            if (byFn.size === 0) byNamespace.delete(ns);
          }

          if (byNamespace.size === 0) bySelector.delete(selector);
          if (bySelector.size === 0) byEvent.delete(resolvedEventType);
          if (byEvent.size === 0) delegatedHandlers.delete(rootEl);
        }

        return this;
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

      const targets = this._getElementArray();
      if (!targets.length) return this;

      const toInsertables = (input) => {
        if (!input) return [];
        if (isDomManInstance(input)) return toElementArray(input._getElements());
        if (input instanceof NodeList || input instanceof HTMLCollection) {
          return Array.from(input);
        }
        if (Array.isArray(input)) return input;
        return [input];
      };

      const items = toInsertables(ctn);

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        if (!target.parentNode) continue;

        // Insert in reverse to preserve original item order
        for (let ii = items.length - 1; ii >= 0; ii--) {
          const item = items[ii];
          if (item == null) continue;

          const nodeToInsert =
            item instanceof Node
              ? ti === 0
                ? item
                : item.cloneNode(true)
              : document.createTextNode(String(item));

          target.parentNode.insertBefore(nodeToInsert, target);
        }
      }
      return this;
    },
    /**
     * Insert content after an element
     * @param {Node|Object} ctn - Content to insert
     * @returns {Object} domMan object for chaining
     */
    after: function (ctn) {
      if (!ctn) return this;

      const targets = this._getElementArray();
      if (!targets.length) return this;

      const toInsertables = (input) => {
        if (!input) return [];
        if (isDomManInstance(input)) return toElementArray(input._getElements());
        if (input instanceof NodeList || input instanceof HTMLCollection) {
          return Array.from(input);
        }
        if (Array.isArray(input)) return input;
        return [input];
      };

      const items = toInsertables(ctn);

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        if (!target.parentNode) continue;

        const insertBefore = target.nextSibling;
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          if (item == null) continue;

          const nodeToInsert =
            item instanceof Node
              ? ti === 0
                ? item
                : item.cloneNode(true)
              : document.createTextNode(String(item));

          target.parentNode.insertBefore(nodeToInsert, insertBefore);
        }
      }
      return this;
    },
    /**
     * Get the next sibling element
     * @returns {Object} domMan object with the next sibling
     */
    next: function () {
      const arr = this._getElementArray();
      if (!arr.length) return $d([]);

      const out = [];
      const seen = new Set();
      for (let i = 0; i < arr.length; i++) {
        const n = arr[i].nextElementSibling;
        if (n && !seen.has(n)) {
          seen.add(n);
          out.push(n);
        }
      }

      return $d(out);
    },
    /**
     * Get the previous sibling element
     * @returns {Object} domMan object with the previous sibling
     */
    prev: function () {
      const arr = this._getElementArray();
      if (!arr.length) return $d([]);

      const out = [];
      const seen = new Set();
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i].previousElementSibling;
        if (p && !seen.has(p)) {
          seen.add(p);
          out.push(p);
        }
      }

      return $d(out);
    },
    /**
     * Check if an element is empty
     * @returns {boolean} True if element is empty
     */
    isEmpty: function () {
      const first = this._getFirstElement();
      if (!first) return true;
      return first.innerHTML.trim() === "";
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
        debugError("Invalid arguments for paginate method");
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

    /**
     * Create a Text node.
     * Note: returns a raw Node (not a domMan instance).
     * @param {string} text
     * @returns {Text}
     */
    createTextNode: (text) => {
      return document.createTextNode(text);
    },

    /**
     * Create a Comment node.
     * Note: returns a raw Node (not a domMan instance).
     * @param {string} text
     * @returns {Comment}
     */
    createComment: (text) => {
      return document.createComment(text);
    },

    /**
     * Create a DocumentFragment.
     * Note: returns a raw DocumentFragment (not a domMan instance).
     * @returns {DocumentFragment}
     */
    createDocumentFragment: () => {
      return document.createDocumentFragment();
    },

    // Node manipulation

    /**
     * Append child node(s) to each matched element.
     *
     * When multiple targets exist, Node inputs are cloned as needed so each
     * target receives a copy.
     *
     * @param {Node|string|Object|Array} child
     * @returns {Object} domMan object for chaining
     */
    appendChild: function (child) {
      const targets = this._getElementArray();
      if (!targets.length) return this;

      const toInsertables = (input) => {
        if (input == null) return [];
        if (isDomManInstance(input)) return toElementArray(input._getElements());
        if (input instanceof NodeList || input instanceof HTMLCollection) {
          return Array.from(input);
        }
        if (Array.isArray(input)) return input;
        return [input];
      };

      const items = toInsertables(child);

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          if (item == null) continue;

          const nodeToInsert =
            item instanceof Node
              ? ti === 0
                ? item
                : item.cloneNode(true)
              : document.createTextNode(String(item));

          target.appendChild(nodeToInsert);
        }
      }

      return this;
    },

    /**
     * Remove child node(s) from each matched element.
     * Only removes nodes that are contained by the target.
     * @param {Node|Object|Array} child
     * @returns {Object} domMan object for chaining
     */
    removeChild: function (child) {
      const targets = this._getElementArray();
      if (!targets.length || child == null) return this;

      const children =
        isDomManInstance(child)
          ? toElementArray(child._getElements())
          : child instanceof NodeList || child instanceof HTMLCollection
          ? Array.from(child)
          : Array.isArray(child)
          ? child
          : [child];

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        for (let ci = 0; ci < children.length; ci++) {
          const c = children[ci];
          if (!(c instanceof Node)) continue;
          if (target.contains(c)) {
            target.removeChild(c);
          }
        }
      }

      return this;
    },

    /**
     * Replace a child node inside the matched element(s).
     *
     * Replaces the first target that contains `oldChild`.
     * When multiple targets exist, the replacement is cloned as needed.
     *
     * @param {Node|string|Object} newChild
     * @param {Node|Object} oldChild
     * @returns {Object} domMan object for chaining
     */
    replaceChild: function (newChild, oldChild) {
      const targets = this._getElementArray();
      if (!targets.length) return this;

      const oldNode =
        isDomManInstance(oldChild) ? oldChild._getFirstElement() : oldChild;

      if (!(oldNode instanceof Node)) return this;

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        if (!target.contains(oldNode)) continue;

        const newNode =
          newChild instanceof Node
            ? ti === 0
              ? newChild
              : newChild.cloneNode(true)
            : document.createTextNode(String(newChild));

        target.replaceChild(newNode, oldNode);
        break;
      }

      return this;
    },

    /**
     * Insert a node before `referenceNode` inside each matched element.
     * When multiple targets exist, Node inputs are cloned as needed.
     * @param {Node|string|Object} newNode
     * @param {Node|Object} referenceNode
     * @returns {Object} domMan object for chaining
     */
    insertBefore: function (newNode, referenceNode) {
      const targets = this._getElementArray();
      if (!targets.length) return this;

      const ref =
        isDomManInstance(referenceNode)
          ? referenceNode._getFirstElement()
          : referenceNode;

      if (!(ref instanceof Node)) return this;

      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        if (!target.contains(ref)) continue;

        const nodeToInsert =
          newNode instanceof Node
            ? ti === 0
              ? newNode
              : newNode.cloneNode(true)
            : document.createTextNode(String(newNode));

        target.insertBefore(nodeToInsert, ref);
      }

      return this;
    },
    // Node properties
    /**
     * Get child nodes of the first matched element.
     * @returns {Node[]} Array of child nodes
     */
    childNodes: function () {
      const first = this._getFirstElement();
      if (!first) return [];
      return Array.from(first.childNodes);
    },

    /**
     * Get the first child node of the first matched element.
     * @returns {Node|null}
     */
    firstChild: function () {
      const first = this._getFirstElement();
      return first ? first.firstChild : null;
    },

    /**
     * Get the last child node of the first matched element.
     * @returns {Node|null}
     */
    lastChild: function () {
      const first = this._getFirstElement();
      return first ? first.lastChild : null;
    },

    /**
     * Get an attribute from the first matched element.
     * @param {string} att - Attribute name
     * @returns {string|null} Attribute value, or null if missing/empty selection
     */
    getAttribute: function (att) {
      const first = this._getFirstElement();
      if (!first) return null;
      return first.getAttribute(att);
    },

    /**
     * Set an attribute on all matched elements.
     * @param {string} name - Attribute name
     * @param {string} value - Attribute value
     * @returns {Object} domMan object for chaining
     */
    setAttribute: function (name, value) {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].setAttribute(name, value);
      }
      return this;
    },
    /**
     * Remove an attribute from an element
     * @param {string} att - Attribute name
     * @returns {Object} domMan object for chaining
     */
    removeAttribute: function (att) {
      const arr = this._getElementArray();
      for (let i = 0; i < arr.length; i++) {
        arr[i].removeAttribute(att);
      }
      return this;
    },

    /**
     * Check whether the first matched element has an attribute.
     * @param {string} name - Attribute name
     * @returns {boolean}
     */
    hasAttribute: function (name) {
      const first = this._getFirstElement();
      return !!(first && first.hasAttribute(name));
    },
    // ---- End of protype ----
  };
  // proxy test
  // Debug mode is opt-in for publishing friendliness (no noisy logs by default).
  domMan.debugMode = false;
  domMan.setDebugMode = function (enabled) {
    domMan.debugMode = !!enabled;
    return domMan;
  };

  /**
   * Proxy-powered dynamic API.
   *
   * In addition to the explicit methods defined on `domMan.pt`, a Proxy intercepts
   * unknown property accesses to provide convenience behaviors.
   *
   * Supported patterns (high-level):
   * - Event shortcuts: `$d('button').click(handler)` (bind) and `$d('button').click()` (trigger)
   * - DOM method proxies: e.g. `focus()`, `blur()`, `scrollIntoView()` applied to all matches
   * - DOM property routing (guarded): if `prop in firstElement`, getter reads from first element
   *   and setter writes to all matched elements
   * - CSS style routing: some properties can be set via dynamic helpers when no DOM property exists
   *
   * Collision/precedence notes:
   * - If a method exists directly on `domMan.pt`, it wins.
   * - DOM-property routing is guarded by `prop in firstElement` to avoid collisions with
   *   CSS-like names (e.g. `src`, `volume`).
   */
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

      // 0. DOM methods (used both directly and for event/method collisions)
      const domMethods = {
        // Element methods
        focus: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].focus === "function") arr[i].focus();
          }
          return this;
        },
        blur: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].blur === "function") arr[i].blur();
          }
          return this;
        },
        click: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].click === "function") arr[i].click();
          }
          return this;
        },
        scrollIntoView: function (options) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].scrollIntoView === "function") {
              arr[i].scrollIntoView(options);
            }
          }
          return this;
        },
        matches: function (selector) {
          const first = this._getFirstElement();
          return !!(first && typeof first.matches === "function" && first.matches(selector));
        },
        closest: function (selector) {
          const first = this._getFirstElement();
          if (!first || typeof first.closest !== "function") return null;
          return first.closest(selector);
        },
        // Form methods
        checkValidity: function () {
          const first = this._getFirstElement();
          if (first && first instanceof HTMLFormElement) {
            return first.checkValidity();
          }
          return false;
        },
        reportValidity: function () {
          const first = this._getFirstElement();
          if (first && first instanceof HTMLFormElement) {
            return first.reportValidity();
          }
          return false;
        },
        submit: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (el instanceof HTMLFormElement) {
              // requestSubmit dispatches a submit event; submit() does not.
              if (typeof el.requestSubmit === "function") {
                el.requestSubmit();
              } else {
                el.submit();
              }
            }
          }

          return this;
        },
        reset: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (el instanceof HTMLFormElement) el.reset();
          }

          return this;
        },
        // Media methods
        play: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (el instanceof HTMLMediaElement) el.play();
          }

          return this;
        },
        pause: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (el instanceof HTMLMediaElement) el.pause();
          }

          return this;
        },
        load: function () {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (el instanceof HTMLMediaElement) el.load();
          }

          return this;
        },
        // Canvas methods
        getContext: function (contextId) {
          const first = this._getFirstElement();
          if (first && first instanceof HTMLCanvasElement) {
            return first.getContext(contextId);
          }
          return null;
        },
        toDataURL: function (type, quality) {
          const first = this._getFirstElement();
          if (first && first instanceof HTMLCanvasElement) {
            return first.toDataURL(type, quality);
          }
          return null;
        },
        // Scroll methods
        scrollTo: function (x, y) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].scrollTo === "function") arr[i].scrollTo(x, y);
          }

          return this;
        },
        scrollBy: function (x, y) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i].scrollBy === "function") arr[i].scrollBy(x, y);
          }

          return this;
        },
        // ClassList methods
        toggleClass: function (className, force) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            arr[i].classList.toggle(className, force);
          }

          return this;
        },
        containsClass: function (className) {
          const first = this._getFirstElement();
          return !!(first && first.classList.contains(className));
        },
        replaceClass: function (oldClass, newClass) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            arr[i].classList.replace(oldClass, newClass);
          }

          return this;
        },
        // Attribute methods
        getAttribute: function (name) {
          const first = this._getFirstElement();
          return first ? first.getAttribute(name) : null;
        },
        setAttribute: function (name, value) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            arr[i].setAttribute(name, value);
          }

          return this;
        },
        removeAttribute: function (name) {
          const arr = this._getElementArray();
          for (let i = 0; i < arr.length; i++) {
            arr[i].removeAttribute(name);
          }

          return this;
        },
        hasAttribute: function (name) {
          const first = this._getFirstElement();
          return !!(first && first.hasAttribute(name));
        },
        // Geometry/measurement methods
        getBoundingClientRect: function () {
          const first = this._getFirstElement();
          return first ? first.getBoundingClientRect() : null;
        },
      };

      // 1. If property already exists in target, return it
      if (prop in target) {
        
        return Reflect.get(target, prop, receiver);
      }

      // 2. Handle event shortcut vs DOM method collisions
      const isEventShortcut =
        standardEvents.includes(prop) || (typeof prop === "string" && prop in aliases);
      const eventName = typeof prop === "string" ? aliases[prop] || prop : prop;

      if (typeof prop === "string" && isEventShortcut && prop in domMethods) {
        return function (...args) {
          // No args: invoke DOM method (e.g. .click(), .focus(), .submit())
          if (args.length === 0) {
            return domMethods[prop].call(this);
          }
          // One function arg: bind event (e.g. .click(fn))
          if (args.length === 1 && typeof args[0] === "function") {
            return this.on(eventName, args[0]);
          }
          // Fallback: treat as method call with args
          return domMethods[prop].apply(this, args);
        };
      }

      // 3. Prefer direct DOM methods when present
      if (typeof prop === "string" && prop in domMethods) {
        return domMethods[prop];
      }

      // 4. Check if it's a standard event or alias
      if (isEventShortcut) {

        return function (fn) {
          if (!fn || typeof fn !== "function") return this;
          return this.on(eventName, fn);
        };
      }

      // 5. Check if it's a DOM property
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

      const shouldHandleAsDomProperty = (() => {
        if (!domProperties.includes(prop)) return false;
        try {
          const first =
            receiver && typeof receiver._getFirstElement === "function"
              ? receiver._getFirstElement()
              : null;

          // If there is no element, keep the old no-op-friendly behavior.
          if (!first) return true;

          return prop in first;
        } catch (e) {
          // If anything goes weird (very old environments), fall back to the previous behavior.
          return true;
        }
      })();

      if (shouldHandleAsDomProperty) {
        return function (value) {
          const arr = this._getElementArray();
          const first = arr.length ? arr[0] : null;
          if (!first) return this;

          // Getter mode
          if (value === undefined) {
            return first[prop];
          }

          // Setter mode
          for (let i = 0; i < arr.length; i++) {
            arr[i][prop] = value;
          }

          return this;
        };
      }

      // 6. Check if it's a CSS property
      // NOTE: Some names (e.g. "src") exist on CSSStyleDeclaration in some environments.
      // Prefer DOM property semantics when there's overlap.
      const tempElement = document.createElement("div");
      if (prop in tempElement.style) {
        return function (value) {
          const arr = this._getElementArray();
          const first = arr.length ? arr[0] : null;
          if (!first) return this;

          // Getter mode
          if (value === undefined) {
            return window.getComputedStyle(first)[prop];
          }

          // Setter mode
          for (let i = 0; i < arr.length; i++) {
            arr[i].style[prop] = value;
          }
          // console.log(`2607  ${receiver}`);
          return this;
        };
      }

      // 5. DOM methods already handled above

      // 6. DEBUG MODE warnings
      if (
        domMan.debugMode &&
        typeof prop === "string" &&
        !prop.startsWith("_")
      ) {
        debugWarn(`domMan: Attempting to access undefined property '${prop}'`);
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

  // Capture any existing globals BEFORE overwriting them.
  // This allows noConflict() to restore prior values correctly.
  var _domMan = window.domMan,
    _$d = window.$d;

  if (typeof noGlobal === "undefined") {
    window.domMan = window.$d = domMan;
  }

  // Static helpers (jQuery-style)
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
      clonedDomMan.pt = clonedDomMan.prototype = domMan.pt.deepClone(domMan.pt);

      // Fix constructor reference
      clonedDomMan.pt.constructor = clonedDomMan;

      // Clone the initialization function
      var clonedInit = function (selector) {
        if (!selector) {
          this.elements = [];
          this.length = 0;
          return this;
        }

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
        } else if (isDomManInstance(selector)) {
          this.elements = selector._getElements();
        } else {
          this.elements = [];
        }

        // jQuery-like count of matched Elements
        this.length = toElementArray(this.elements).length;

        return this;
      };

      // Set up the init function
      clonedDomMan.pt.init = clonedInit;
      clonedInit.prototype = clonedDomMan.pt;

      // Copy selected utility methods directly to the cloned object
      clonedDomMan.isElement = domMan.isElement;
      clonedDomMan.ready = domMan.ready;
      clonedDomMan.deepClone = domMan.deepClone;

      return clonedDomMan;
    }

    return domMan;
  };

  // Expose deepClone as a static helper too
  domMan.deepClone = function (obj) {
    return domMan.pt.deepClone.call(domMan.pt, obj);
  };

  return domMan;
  //--------------------------End of domMan--------------------------
});
// ---- End of UMD ----

