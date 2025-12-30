const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

class FakeResizeObserver {
  static instances = [];

  constructor(cb) {
    this.cb = cb;
    this.observed = [];
    this.disconnected = false;
    FakeResizeObserver.instances.push(this);
  }

  observe(el) {
    this.observed.push(el);
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeIntersectionObserver {
  static instances = [];

  constructor(cb, options) {
    this.cb = cb;
    this.options = options;
    this.observed = [];
    this.unobserved = [];
    this.disconnected = false;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el) {
    this.observed.push(el);
  }

  unobserve(el) {
    this.unobserved.push(el);
  }

  disconnect() {
    this.disconnected = true;
  }

  trigger(entries) {
    this.cb(entries);
  }
}

test("onResize()/unobserveResize(): wires ResizeObserver and disconnects", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  window.ResizeObserver = FakeResizeObserver;

  const el = document.getElementById("a");
  const calls = [];

  const $el = $d(el).onResize((entry, target) => {
    calls.push({ entry, target });
  });

  assert.equal(FakeResizeObserver.instances.length, 1);
  assert.deepEqual(FakeResizeObserver.instances[0].observed, [el]);
  assert.ok(Array.isArray($el._resizeObservers));

  $el.unobserveResize();
  assert.equal(FakeResizeObserver.instances[0].disconnected, true);
  assert.equal($el._resizeObservers.length, 0);
});

test("whenVisible(): default once behavior unobserves and disconnects", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  window.IntersectionObserver = FakeIntersectionObserver;

  const el = document.getElementById("a");
  const hits = [];

  $d(el).whenVisible((entry, target) => {
    hits.push({ entry, target });
  });

  const obs = FakeIntersectionObserver.instances[0];
  assert.deepEqual(obs.observed, [el]);

  obs.trigger([{ isIntersecting: true, target: el }]);

  assert.equal(hits.length, 1);
  assert.deepEqual(obs.unobserved, [el]);
  assert.equal(obs.disconnected, true);
});
