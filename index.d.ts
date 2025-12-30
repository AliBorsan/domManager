// Minimal TypeScript typings for domMan

declare namespace domMan {
  type Selector = string | Node | NodeListOf<Element> | HTMLCollectionOf<Element> | Element[] | domMan.DomMan;

  /**
   * Event strings support optional namespaces like "click.menu".
   * Note: Custom event names containing dots (e.g. "hello.world") are also allowed at runtime;
   * domMan only treats the suffix as a namespace for known DOM events.
   */
  type NamespacedEvent = `${string}.${string}`;
  type DomManEvent = string | NamespacedEvent;
  /** Namespace-only form for removals: off('.menu') */
  type NamespaceOnly = `.${string}`;
  type DomManOffEvent = DomManEvent | NamespaceOnly;

  interface DomMan {
    // Selection
    elements: any;
    length: number;

    // Core helpers
    _getElementArray(): Element[];
    _getFirstElement(): Element | null;

    // New helpers
    find(selector: string): DomMan;
    findOne(selector: string): DomMan;
    tap(fn: (self: DomMan, elements: Element[]) => void): DomMan;
    toArray(): Element[];
    asArray(): Element[];

    // Events (supports direct + delegated)
    on(evt: DomManEvent, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): DomMan;
    on(evt: DomManEvent, selector: string, handler: (ev: Event, matched: Element) => void, options?: boolean | AddEventListenerOptions): DomMan;

    off(evt: DomManEvent, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): DomMan;
    off(evt: DomManEvent, selector: string, handler: (ev: Event, matched: Element) => void, options?: boolean | AddEventListenerOptions): DomMan;
    off(evt: DomManOffEvent): DomMan;
    off(evt: DomManEvent, selector: string): DomMan;

    one(evt: DomManEvent, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): DomMan;
    one(evt: DomManEvent, selector: string, handler: (ev: Event, matched: Element) => void, options?: boolean | AddEventListenerOptions): DomMan;

    trigger(evt: string, detail?: any, eventInit?: EventInit): DomMan;
    triggerHandler(evt: string, detail?: any, eventInit?: EventInit): DomMan;

    // CSS vars
    cssVar(name: string, value?: string): DomMan | string;
    cssVar(map: Record<string, string>): DomMan;

    // Proxy-based API support
    [key: string]: any;
  }
}

declare function domMan(selector?: domMan.Selector): domMan.DomMan;

declare const $d: typeof domMan;

declare global {
  interface Window {
    domMan: typeof domMan;
    $d: typeof domMan;
  }
}

export = domMan;
