# domMan

[![npm version](https://img.shields.io/npm/v/%40aliborsan%2Fdommanager.svg)](https://www.npmjs.com/package/@aliborsan/dommanager) [![CI](https://github.com/AliBorsan/domManager/actions/workflows/ci.yml/badge.svg)](https://github.com/AliBorsan/domManager/actions/workflows/ci.yml)

domMan stands for **DOM Manager**.

A lightweight, chainable DOM utility inspired by jQuery.

domMan focuses on:

- A small, practical chainable API (`$d(...)` / `domMan(...)`)
- Multi-selection safety (setters/actions apply to all matches; getters read from the first)
- A modern event API (direct + delegated, `one()`, `trigger()`, event namespaces)
- A Proxy-powered “dynamic API” for ergonomic DOM/CSS/property shortcuts

This repo includes automated tests (Node test runner + jsdom) and TypeScript typings.

## Table of contents

- Install
- Quick start
- Core conventions
- Common recipes
- Events (including namespaces)
- API reference (by category)
- Proxy-powered dynamic API
- Migration from jQuery (quick equivalents)
- Gotchas & notes
- Versioning & API stability
- Browser support
- TypeScript
- Demos
- Tests
- Contributing
- License & policies

## Install

### npm

```bash
npm i @aliborsan/dommanager
```

Then in a bundler / Node environment:

```js
import domMan from '@aliborsan/dommanager';

// Optional alias (to match the docs)
const $d = domMan;
```

### Local/dev (this repo)

```bash
npm install
```

### Browser (UMD)

Include the UMD file directly:

```html
<script src="domman.js"></script>
```

You get globals:

- `window.$d`
- `window.domMan`

## Quick start

```html
<button id="btn">Click</button>
<ul id="list">
  <li class="item">One</li>
  <li class="item">Two</li>
</ul>

<script src="domman.js"></script>
<script>
  // Select
  const $btn = $d('#btn');

  // Setters/actions apply to all matched elements
  $d('.item')
    .addClass('active')
    .css('color', 'red');

  // Getters read from the first matched element
  const firstText = $d('.item').text();
  console.log(firstText);

  // Events
  $btn.on('click', () => console.log('clicked'));

  // Delegated events
  $d('#list').on('click', 'li', (e, matched) => {
    console.log('clicked item', matched);
  });
</script>
```

## Core conventions

### What you can pass to `$d(...)`

`$d()` accepts:

- CSS selector string
- a single `Element`
- a `NodeList` / `HTMLCollection`
- an `Element[]`
- another `domMan` instance

### Setters vs getters (multi-selection semantics)

domMan follows a predictable rule:

- **Setters/actions** apply to **all** matched elements and return `this` for chaining.
  - Examples: `addClass`, `remove`, `css`, `cssObject`, `html('...')`, `append(...)`, `on(...)`
- **Getters/queries** read from the **first** matched element.
  - Examples: `html()`, `text()`, `val()`, `hasClass()`, `getAttribute()`

This keeps behavior consistent even when a selector matches multiple elements.

## Common recipes

### Create elements

```js
const el = $d().createElement('button', {
  className: 'btn',
  style: { padding: '8px 12px' },
  onclick: () => console.log('hello'),
});

$d('#root').append(el);
```

### Insert content

```js
$d('#root').append('Hello');
$d('#root').pre('Start: ');

// Before/after a target
$d('#target').before('Before ');
$d('#target').after(' After');
```

### Traverse

```js
// Union of parents for multi-selection
const $parents = $d('.item').parent();

// Flattened children across all matches
const $kids = $d('#list').children();

// Unique siblings excluding the selection
const $sib = $d('.item').siblings();
```

### Data storage (in-memory)

```js
$d('.item').data('role', 'row');      // sets on all
console.log($d('.item').data('role')); // reads from first

$d('.item').removeData('role');
```

### LocalStorage helpers

```js
$d().setLocalStorage('prefs', { theme: 'dark' });
console.log($d().getLocalStorage('prefs'));
$d().removeLocalStorage('prefs');
```

## Events

### Direct events

```js
$d('#btn').on('click', (e) => {
  console.log('clicked', e.target);
});
```

### Delegated events

```js
$d('#list').on('click', 'li', function (e, matched) {
  // `this` is the matched element
  console.log('clicked item', matched);
});
```

### `one()` (once)

```js
$d('#btn').one('click', () => {
  console.log('runs once');
});
```

### `off()` (remove listeners)

```js
function onClick() {
  console.log('clicked');
}

$d('#btn').on('click', onClick);
$d('#btn').off('click', onClick);
```

Delegated removal:

```js
function onItemClick(e) {
  console.log('delegated', this);
}

$d('#list').on('click', 'li', onItemClick);
$d('#list').off('click', 'li', onItemClick);
```

### `trigger()` / `triggerHandler()`

```js
$d('#btn').trigger('click');

// Like jQuery triggerHandler(): dispatches only on first match, without bubbling
$d('#btn').triggerHandler('custom', { any: 'data' });
```

### Namespaced events

For **known DOM events**, you can namespace handlers with `type.namespace`:

```js
$d('#btn').on('click.menu', () => console.log('menu click'));
$d('#btn').on('click.other', () => console.log('other click'));

// Remove only the ".menu" handlers (including delegated ones)
$d('#btn').off('.menu');
```

Important:

- Namespace-only strings like `.menu` are only meaningful for `off('.menu')`.
- Custom event names containing dots (e.g. `hello.world`) are treated as a single custom event name, not a namespace.

## API reference (by category)

Below is a practical overview of the public API in this build.

### Selection

- `$d(selectorOrElementOrList)`
- `.length` — number of matched elements
- `.toArray()` / `.asArray()` — get a normalized `Element[]`

### Content

- `.val(value?)` — get/set input value
- `.text(t?)` — get/set innerText
- `.textContent(text?)` — get/set textContent
- `.html(html?)` — get/set innerHTML
- `.outerHTML(html?)` — get/set outerHTML

### Classes

- `.addClass(name)`
- `.removeClass(name)`
- `.toggleClass(name)`
- `.hasClass(name)`

### Styles

- `.css(prop, value)`
- `.cssObject({ ... })`
- `.cssVar(nameOrObject, value?)`

### DOM insertion

- `.append(ctn)` / `.pre(ctn)`
- `.before(ctn)` / `.after(ctn)`
- `.appendTo(target)` / `.prependTo(target)`

When multiple targets are matched, Node inputs are cloned as needed so each target gets a copy.

### Traversal

- `.parent()` — unique parents
- `.children()` — flattened children
- `.siblings()` — unique siblings excluding selection
- `.next()` / `.prev()` — unions for multi-selection

### Attributes + node helpers

- `.getAttribute(name)` (first element)
- `.setAttribute(name, value)` (all)
- `.removeAttribute(name)` (all)
- `.hasAttribute(name)` (first)
- `.childNodes()` (first)
- `.firstChild()` / `.lastChild()` (first)

### Data

- `.data(key?, value?)`
- `.removeData(key?)`

### Local storage

- `.setLocalStorage(key, value)`
- `.getLocalStorage(key)`
- `.removeLocalStorage(key)`
- `.clearLocalStorage()`

### AJAX

- `.ajax({ method, url, data, headers, responseType })` (Promise)
- `.get(url, data?, options?)`
- `.post(url, data?, options?)`

Example:

```js
// GET
$d()
  .get('https://httpbin.org/json')
  .then((json) => console.log('json keys:', Object.keys(json)))
  .catch((err) => console.log('ajax error (CORS/file://):', err));

// POST (JSON body)
$d()
  .post('https://httpbin.org/post', { hello: 'world' }, {
    headers: { 'Content-Type': 'application/json' },
  })
  .then((res) => console.log('posted ok:', !!res))
  .catch((err) => console.log('ajax error:', err));
```

### Forms + validation

- `.serializeForm(format?)` where `format` is `"object" | "json" | "urlencoded"`
- `.submitForm(ajax?, callback?)`
- `.resetForm()`
- `.formValue(name?, value?)`
- `.validate(rules?, options?)`
- `.applyValidationAttributes(rules)`

Examples:

```js
// Serialize form
const formEl = document.querySelector('#myForm');
const obj = $d(formEl).serializeForm('object');
console.log(obj);

// Get/set individual values
console.log($d(formEl).formValue('email'));
$d(formEl).formValue('email', 'a@example.com');
```

```js
// Validate
const rules = {
  email: { required: true, pattern: 'email' },
  age: { min: 18, max: 120 },
};

const ok = $d('#myForm').validate(rules);
console.log('valid?', ok);

// Apply validation attributes to inputs (required/pattern/min/max/minlength/maxlength)
$d('#myForm').applyValidationAttributes(rules);
```

```js
// Submit helper (AJAX mode)
$d('#myForm').submitForm(true, (err, response) => {
  if (err) return console.log('submit failed:', err);
  console.log('submit response:', response);
});
```

### Observers

- `.onResize(callback)` / `.unobserveResize()`
- `.onIntersect(callback, options?)`
- `.whenVisible(callback, { once?, root?, rootMargin?, threshold? })`
- `.unobserve()` (disconnects stored observers)

Example:

```js
// ResizeObserver
$d('#panel').onResize((entry, el) => {
  console.log('resized:', el, entry && entry.contentRect);
});

// IntersectionObserver (runs whenever visibility changes)
$d('#hero').onIntersect((entry, el) => {
  console.log('intersection:', entry.isIntersecting, el);
});

// Run once when visible
$d('#lazy').whenVisible(() => {
  console.log('lazy is visible');
}, { once: true });
```

### Animations + transitions

- `.fadeIn(duration?)`
- `.animate(props, duration?, easing?, callback?)`
- `.animateKeyframes(keyframes, options?)`
- `.pauseAnimation()` / `.resumeAnimation()` / `.cancelAnimation()`
- `.addClassWithTransition(className, duration?, easing?)`

Examples:

```js
$d('#box').fadeIn(200);

$d('#box').animate(
  { opacity: '0.5', transform: 'translateX(12px)' },
  300,
  'ease',
  function () {
    console.log('done', this);
  }
);
```

```js
// Web Animations API wrapper (if supported by the browser)
$d('#box').animateKeyframes(
  [
    { transform: 'translateX(0px)' },
    { transform: 'translateX(40px)' },
  ],
  { duration: 250, fill: 'forwards' }
);

// Later:
$d('#box').pauseAnimation();
$d('#box').resumeAnimation();
// or:
$d('#box').cancelAnimation();
```

### Pagination

- `.paginate(items, itemsPerPage, renderItem, options?)`

Example:

```js
const items = ['a', 'b', 'c', 'd', 'e'];

$d('#list').paginate(
  items,
  2,
  (item) => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  },
  { showFirstLast: true }
);
```

### Plugins (extend)

- `.extend({ methodName() { ... } })` (adds to the active domMan prototype)

Example:

```js
$d().extend({
  flash() {
    return this.addClass('flash');
  },
});

$d('.item').flash();
```

### noConflict

- `domMan.noConflict(deep?)`

Example:

```js
// Restore prior globals and return domMan
const dm = window.domMan.noConflict();

// Or get an isolated clone (deep prototype clone)
const dmClone = window.domMan.noConflict(true);
dmClone('.item').addClass('from-clone');
```

### cssPseudo

- `.cssPseudo(pseudoClass, styles, baseStyles?, options?)`

Example:

```js
$d('.btn').cssPseudo(
  'hover',
  { backgroundColor: '#222', color: '#fff' },
  { backgroundColor: '#eee', color: '#111' },
  { duration: 200, timing: 'ease' }
);
```

### Events

- `.on(evt, handler, options?)`
- `.on(evt, selector, handler, options?)` (delegated)
- `.off(evt?, handler?)` and delegated variants
- `.one(...)` (same overloads as `.on()`; runs once)
- `.trigger(evt, detail?, eventInit?)`
- `.triggerHandler(evt, detail?, eventInit?)`

## Proxy-powered dynamic API

This build wraps `domMan.pt` in a Proxy so some properties behave like helpers.

### Event shortcuts

For common DOM events, you can use:

```js
// Trigger
$d('#btn').click();

// Bind
$d('#btn').click(() => console.log('clicked'));
```

### DOM property routing (guarded)

If the property exists on the first element, getters read from the first element and setters apply to all matched elements.

This behavior is intentionally guarded (`prop in firstElement`) to avoid collisions with CSS-like names.

## Migration from jQuery (quick equivalents)

domMan is not a full jQuery clone, but many everyday patterns translate cleanly.

### Selection

```js
// jQuery:  const $el = $('#id')
const $el = $d('#id');

// jQuery:  $(element)
const $wrapped = $d(element);

// jQuery:  $(nodeList)
const $list = $d(document.querySelectorAll('.item'));
```

### Text/HTML/value

```js
// jQuery:  $el.text('hi') / $el.text()
$d('#id').text('hi');
const t = $d('#id').text();

// jQuery:  $el.html('<b>x</b>') / $el.html()
$d('#id').html('<b>x</b>');
const h = $d('#id').html();

// jQuery:  $input.val('a') / $input.val()
$d('#input').val('a');
const v = $d('#input').val();
```

### Classes + styles

```js
// jQuery: $el.addClass/removeClass/toggleClass/hasClass
$d('.item').addClass('active');
$d('.item').removeClass('active');
$d('.item').toggleClass('active');
const ok = $d('.item').hasClass('active');

// jQuery: $el.css('color', 'red')
$d('.item').css('color', 'red');

// jQuery: $el.css({ color: 'red', backgroundColor: 'black' })
$d('.item').cssObject({ color: 'red', backgroundColor: 'black' });
```

### Insert content

```js
// jQuery: $el.append(x) / $el.prepend(x)
$d('#root').append('Hello');
$d('#root').pre('Start: ');

// jQuery: $el.before(x) / $el.after(x)
$d('#target').before('Before ');
$d('#target').after(' After');
```

### Events

```js
// jQuery: $el.on('click', fn)
$d('#btn').on('click', fn);

// jQuery: $el.on('click', 'li', fn) (delegation)
$d('#list').on('click', 'li', fn);

// jQuery: $el.one('click', fn)
$d('#btn').one('click', fn);

// jQuery: $el.off('click', fn)
$d('#btn').off('click', fn);

// jQuery: $el.trigger('click')
$d('#btn').trigger('click');
```

## Gotchas & notes

### Multi-selection behavior is intentional

- Setters/actions apply to **all** matched elements.
- Getters read from the **first** matched element.

If you need the raw elements, use `.toArray()` / `.asArray()`.

### Node cloning with multi-target insertion

Methods like `.append()`, `.pre()`, `.before()`, `.after()`, `.appendChild()` will clone `Node` inputs as needed when multiple targets are matched.

Example:

```js
const node = document.createElement('span');
node.textContent = 'Hi';

// If multiple targets match, domMan clones `node` so each target gets a copy.
$d('.item').append(node);
```

### Namespaces are only for known DOM events

- `click.menu` is treated as a namespaced DOM event handler.
- `.menu` by itself is used for `off('.menu')` (namespace-only removal).
- Custom events containing dots (example: `hello.world`) are treated as a single event name.

### Proxy behavior is convenient, but not magic

The Proxy dynamic API is designed to be ergonomic while avoiding common collisions:

- Direct methods on `domMan.pt` win.
- DOM property routing only happens when the property exists on the first element.
- Use explicit methods when you want clarity (`css()`, `setAttribute()`, etc.).

## Versioning & API stability

This project is still evolving.

- Expect small API refinements as docs, tests, and typing coverage improve.
- If you plan to publish, it’s recommended to follow SemVer and document breaking changes in release notes.
- The test suite in [test/domman.test.js](test/domman.test.js) is the “source of truth” for current behavior.

## Browser support

domMan is designed for modern browsers.

- The codebase uses `Proxy`, `Map`, `WeakMap`, `CustomEvent`, and `Element.closest()`.
- If you need to support older browsers (notably legacy IE), you will likely need transpilation and/or polyfills.

## TypeScript

Types live in [index.d.ts](index.d.ts) and are referenced from `package.json`.

## Demos

- [usage.html](usage.html) + [usage-samples.js](usage-samples.js)
- [dom-usage.html](dom-usage.html) + [dom-usage.js](dom-usage.js)

### Heavy-method examples in the demo

The interactive demo in [usage-samples.js](usage-samples.js) includes click-to-run examples for:

- AJAX (`get()` / `ajax()`)
- Forms (`serializeForm()`)
- Animations (`animate()`)
- Traversal + iteration (`find()` + `each()`)
- `noConflict()`

Open the HTML files in a browser (or via a local static server) to try the examples.

## Tests

```bash
npm test
```

Tests live in [test/domman.test.js](test/domman.test.js).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License & policies

- License: [LICENSE](LICENSE)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
