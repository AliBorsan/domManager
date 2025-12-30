# Method → Test Coverage (heuristic)

Generated: 2025-12-30T15:54:22.251Z

This report is a best-effort regex scan of `test/*.js` for references to domMan methods.
It will miss Proxy-driven behaviors and can include occasional false positives/negatives.

## Summary

- Prototype methods (domMan.pt): 104 total, 100 referenced, 4 not referenced
- Static methods (domMan.*): 3 total, 3 referenced, 0 not referenced

## Most Referenced Prototype Methods

| Method | Refs |
| --- | --- |
| getAttribute | 26 |
| textContent | 23 |
| data | 14 |
| createElement | 11 |
| on | 10 |
| firstChild | 7 |
| formValue | 7 |
| children | 6 |
| isValidSelector | 6 |
| _getElementArray | 5 |
| extend | 5 |
| lastChild | 5 |
| off | 5 |
| parent | 5 |
| serializeForm | 4 |
| appendChild | 3 |
| getLocalStorage | 3 |
| hasAttribute | 3 |
| isElement | 3 |
| setAttribute | 3 |
| setLocalStorage | 3 |
| trigger | 3 |
| ajax | 2 |
| animate | 2 |
| clone | 2 |

## Prototype Methods Not Referenced In Tests

- _getElements
- _getFirstElement
- constructor
- init

## Static Methods Not Referenced In Tests

All static methods are referenced at least once.

## Detail (per-file hits)

For deeper inspection, search in the test folder for these methods; this section lists files where each method name appears.

### Prototype methods

- _getElementArray: test/domman.test.js (5)
- addClass: test/domman.test.js (1)
- addClassWithTransition: test/transitions.test.js (1)
- after: test/domman.test.js (1)
- ajax: test/ajax.test.js (2)
- alternateColors: test/gaps-dom-nodes.test.js (1)
- animate: test/animations-advanced.test.js (1), test/domman.test.js (1)
- animateKeyframes: test/animations-advanced.test.js (1)
- append: test/gaps-core-methods.test.js (1)
- appendChild: test/domman.test.js (2), test/noconflict.test.js (1)
- appendTo: test/gaps-core-methods.test.js (1)
- applyValidationAttributes: test/misc-heavy.test.js (1)
- asArray: test/domman.test.js (1)
- before: test/domman.test.js (1)
- cancelAnimation: test/animations-advanced.test.js (1)
- childNodes: test/gaps-dom-nodes.test.js (1)
- children: test/domman.test.js (6)
- clearLocalStorage: test/storage.test.js (1)
- clone: test/gaps-core-methods.test.js (2)
- create: test/gaps-remaining.test.js (1)
- createComment: test/gaps-dom-nodes.test.js (1)
- createDocumentFragment: test/gaps-dom-nodes.test.js (1)
- createElement: test/domman.test.js (5), test/element-create.test.js (1), test/forms.test.js (1), test/gaps-core-methods.test.js (2), test/gaps-remaining.test.js (1), test/noconflict.test.js (1)
- createElementNS: test/element-create.test.js (1), test/misc-heavy.test.js (1)
- createSVG: test/element-create.test.js (1), test/misc-heavy.test.js (1)
- createTextNode: test/gaps-dom-nodes.test.js (1), test/gaps-remaining.test.js (1)
- css: test/gaps-core-methods.test.js (1)
- cssHover: test/domman.test.js (1)
- cssObject: test/domman.test.js (1)
- cssPseudo: test/css-pseudo.test.js (1)
- cssVar: test/domman.test.js (2)
- data: test/ajax.test.js (2), test/css-pseudo.test.js (1), test/domman.test.js (4), test/forms.test.js (2), test/gaps-remaining.test.js (5)
- deepClone: test/misc-heavy.test.js (1)
- delegate: test/domman.test.js (1)
- each: test/gaps-remaining.test.js (1)
- extend: test/noconflict.test.js (2), test/plugins.test.js (3)
- fadeIn: test/fadein.test.js (1)
- find: test/gaps-remaining.test.js (1)
- findOne: test/domman.test.js (2)
- firstChild: test/gaps-core-methods.test.js (1), test/gaps-dom-nodes.test.js (6)
- formValue: test/forms.test.js (7)
- get: test/ajax.test.js (1), test/animations-advanced.test.js (1)
- getAttribute: test/domman.test.js (8), test/element-create.test.js (8), test/misc-heavy.test.js (10)
- getLocalStorage: test/storage.test.js (3)
- hasAttribute: test/domman.test.js (2), test/misc-heavy.test.js (1)
- hasClass: test/domman.test.js (1)
- hide: test/gaps-remaining.test.js (1)
- hover: test/domman.test.js (1)
- html: test/gaps-core-methods.test.js (2)
- insertBefore: test/gaps-dom-nodes.test.js (1)
- isElement: test/gaps-remaining.test.js (3)
- isEmpty: test/domman.test.js (1)
- isValidSelector: test/misc-heavy.test.js (6)
- lastChild: test/gaps-core-methods.test.js (1), test/gaps-dom-nodes.test.js (4)
- next: test/domman.test.js (1)
- noConflict: test/noconflict.test.js (2)
- off: test/domman.test.js (5)
- on: test/domman.test.js (10)
- onIntersect: test/gaps-remaining.test.js (1)
- onReady: test/gaps-core-methods.test.js (1)
- onResize: test/observers.test.js (1)
- one: test/domman.test.js (2)
- outerHTML: test/gaps-dom-nodes.test.js (2)
- paginate: test/paginate.test.js (1)
- parent: test/domman.test.js (5)
- pauseAnimation: test/animations-advanced.test.js (1)
- post: test/ajax.test.js (1)
- pre: test/domman.test.js (1)
- prependTo: test/gaps-core-methods.test.js (1)
- prev: test/domman.test.js (1)
- ready: test/gaps-core-methods.test.js (1)
- remove: test/css-pseudo.test.js (1), test/gaps-core-methods.test.js (1)
- removeAttribute: test/domman.test.js (1)
- removeChild: test/gaps-dom-nodes.test.js (1)
- removeClass: test/gaps-remaining.test.js (1)
- removeCssHover: test/domman.test.js (1)
- removeData: test/gaps-remaining.test.js (2)
- removeHover: test/domman.test.js (1)
- removeLocalStorage: test/storage.test.js (2)
- replaceChild: test/gaps-dom-nodes.test.js (1)
- replaceWith: test/gaps-core-methods.test.js (1)
- resetForm: test/forms.test.js (1)
- resumeAnimation: test/animations-advanced.test.js (1)
- serializeForm: test/forms.test.js (4)
- setAttribute: test/domman.test.js (3)
- setLocalStorage: test/storage.test.js (3)
- siblings: test/domman.test.js (1)
- submitForm: test/forms.test.js (1)
- tap: test/domman.test.js (1)
- text: test/gaps-core-methods.test.js (2)
- textContent: test/css-pseudo.test.js (7), test/domman.test.js (6), test/gaps-core-methods.test.js (5), test/gaps-dom-nodes.test.js (1), test/gaps-remaining.test.js (1), test/misc-heavy.test.js (1), test/paginate.test.js (2)
- toArray: test/domman.test.js (1), test/gaps-remaining.test.js (1)
- toggleClass: test/domman.test.js (1)
- trigger: test/domman.test.js (2), test/observers.test.js (1)
- triggerHandler: test/domman.test.js (1)
- unobserve: test/gaps-remaining.test.js (1), test/misc-heavy.test.js (1)
- unobserveResize: test/observers.test.js (1)
- val: test/domman.test.js (2)
- validate: test/forms.test.js (2)
- whenVisible: test/misc-heavy.test.js (1), test/observers.test.js (1)

### Static methods

- deepClone: test/misc-heavy.test.js (1)
- noConflict: test/noconflict.test.js (2)
- setDebugMode: test/gaps-core-methods.test.js (2)
