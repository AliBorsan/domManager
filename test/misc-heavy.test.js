const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("isValidSelector(): basic acceptance/rejection", () => {
  const { $d } = loadDomMan();

  assert.equal($d().isValidSelector("#id"), true);
  assert.equal($d().isValidSelector(".cls"), true);
  assert.equal($d().isValidSelector("div"), true);
  assert.equal($d().isValidSelector("div > .x"), true);

  // clearly invalid
  assert.equal($d().isValidSelector("div["), false);
  assert.equal($d().isValidSelector(""), false);
});

test("deepClone(): supports Date, Node, arrays, objects", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'><span>hi</span></div></body></html>"
  );

  const el = document.getElementById("a");

  // Build the object in the JSDOM window realm so library-side `instanceof Date`
  // and other realm-sensitive checks behave like real browser usage.
  window.__elForCloneTest = el;
  const obj = window.eval(
    `({
      n: 1,
      s: "x",
      date: new Date("2020-01-01T00:00:00.000Z"),
      node: __elForCloneTest,
      arr: [1, { z: 2 }]
    })`
  );
  delete window.__elForCloneTest;

  const cloned = $d().deepClone(obj);

  assert.equal(cloned.n, 1);
  assert.equal(cloned.s, "x");
  assert.ok(cloned.date instanceof window.Date);
  assert.equal(cloned.date.getTime(), obj.date.getTime());
  assert.notEqual(cloned.date, obj.date);

  // Node should be cloned
  assert.ok(cloned.node instanceof document.defaultView.Node);
  assert.notEqual(cloned.node, el);
  assert.equal(cloned.node.querySelector("span").textContent, "hi");

  // Arrays/objects should be deep
  assert.deepEqual(JSON.parse(JSON.stringify(cloned.arr)), [1, { z: 2 }]);
  assert.notEqual(cloned.arr, obj.arr);
  assert.notEqual(cloned.arr[1], obj.arr[1]);
});

test("createElementNS()/createSVG(): creates namespaced element and applies attributes", () => {
  const { $d } = loadDomMan();

  const svg = $d().createSVG("svg", { width: "10", height: "20" });
  assert.equal(svg.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(svg.getAttribute("width"), "10");
  assert.equal(svg.getAttribute("height"), "20");

  const xlinkNS = "http://www.w3.org/1999/xlink";
  const a = $d().createElementNS("http://www.w3.org/2000/svg", "a", {
    class: "link",
  });
  assert.equal(a.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(a.getAttribute("class"), "link");

  // Just ensure setting namespaced attrs is possible on the returned element.
  a.setAttributeNS(xlinkNS, "xlink:href", "#x");
  assert.ok(a.getAttributeNS(xlinkNS, "href") || a.getAttribute("xlink:href"));
});

test("applyValidationAttributes(): sets required/pattern/min/max/minlength/maxlength", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f'>" +
      "  <input name='email' type='email' value=''/>" +
      "  <input name='age' type='number' value='5'/>" +
      "  <input name='user' type='text' value='a'/>" +
      "</form>" +
      "</body></html>"
  );

  $d("#f").applyValidationAttributes({
    email: { required: true, pattern: "email" },
    age: { min: 1, max: 10 },
    user: { minLength: 2, maxLength: 5 },
  });

  const email = document.querySelector("input[name='email']");
  const age = document.querySelector("input[name='age']");
  const user = document.querySelector("input[name='user']");

  assert.equal(email.hasAttribute("required"), true);
  assert.equal(typeof email.getAttribute("pattern"), "string");
  assert.ok(email.getAttribute("pattern").length > 0);

  assert.equal(age.getAttribute("min"), "1");
  assert.equal(age.getAttribute("max"), "10");

  assert.equal(user.getAttribute("minlength"), "2");
  assert.equal(user.getAttribute("maxlength"), "5");
});

test("unobserve(): disconnects observers and clears internal list", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  class FakeIntersectionObserver {
    static instances = [];
    constructor(cb) {
      this.cb = cb;
      this.disconnected = false;
      FakeIntersectionObserver.instances.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }

  window.IntersectionObserver = FakeIntersectionObserver;

  const el = document.getElementById("a");

  // Use observe() method (not whenVisible) if present in the lib (it is, earlier section).
  // Fallback: call whenVisible to ensure an observer is stored.
  const $el = $d(el);
  if (typeof $el.observe === "function") {
    $el.observe(() => {});
  } else {
    $el.whenVisible(() => {}, { once: false });
  }

  assert.ok(Array.isArray($el._observers));
  assert.ok($el._observers.length > 0);

  $el.unobserve();

  assert.equal($el._observers.length, 0);
  assert.equal(FakeIntersectionObserver.instances[0].disconnected, true);
});
