const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("create(): assigns properties on created element", () => {
  const { document, $d } = loadDomMan();

  const el = $d().create("div", {
    id: "x",
    className: "a",
    textContent: "hi",
  });

  assert.ok(el instanceof document.defaultView.HTMLElement);
  assert.equal(el.tagName, "DIV");
  assert.equal(el.id, "x");
  assert.equal(el.className, "a");
  assert.equal(el.textContent, "hi");
});

test("find(): finds within first matched element and returns domMan", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='root' id='r1'><span class='hit'></span></div>" +
      "<div class='root' id='r2'><span class='hit'></span></div>" +
      "</body></html>"
  );

  const $found = $d(".root").find(".hit");
  assert.equal($found.length, 1);

  const r1 = document.getElementById("r1");
  assert.equal($found.toArray()[0].parentElement, r1);
});

test("each(): iterates elements with (index, element) and this=element", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  const seen = [];
  $d(".x").each(function (i, el) {
    assert.equal(this, el);
    seen.push([i, el.tagName]);
  });

  assert.deepEqual(seen, [
    [0, "DIV"],
    [1, "DIV"],
  ]);

  assert.equal(document.querySelectorAll(".x").length, 2);
});

test("hide(): sets display none on all matched elements", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  $d(".x").hide();

  const nodes = Array.from(document.querySelectorAll(".x"));
  assert.equal(nodes[0].style.display, "none");
  assert.equal(nodes[1].style.display, "none");
});

test("removeClass(): removes class on all matched elements", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x a'></div><div class='x a'></div></body></html>"
  );

  $d(".x").removeClass("a");

  const nodes = Array.from(document.querySelectorAll(".x"));
  assert.equal(nodes[0].classList.contains("a"), false);
  assert.equal(nodes[1].classList.contains("a"), false);
});

test("removeData(): removes stored data key (and all data when omitted)", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  $d(".x").data("k", 1).data("other", 2);

  // Remove one key
  $d(".x").removeData("k");
  assert.equal($d(".x").data("k"), undefined);
  assert.equal($d(".x").data("other"), 2);

  // Remove all
  $d(".x").removeData();
  assert.equal($d(".x").data("other"), undefined);

  assert.equal(document.querySelectorAll(".x").length, 2);
});

test("isElement(): identifies DOM Elements", () => {
  const { document, $d } = loadDomMan();

  assert.equal($d().isElement(document.createElement("div")), true);
  assert.equal($d().isElement(document.createTextNode("x")), false);
  assert.equal($d().isElement(null), false);
});

test("onIntersect(): uses IntersectionObserver and stores observer for cleanup", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  class FakeIntersectionObserver {
    static instances = [];
    constructor(cb, opts) {
      this.cb = cb;
      this.opts = opts;
      this.observed = [];
      this.disconnected = false;
      FakeIntersectionObserver.instances.push(this);
    }
    observe(el) {
      this.observed.push(el);
    }
    disconnect() {
      this.disconnected = true;
    }
  }

  window.IntersectionObserver = FakeIntersectionObserver;

  const el = document.getElementById("a");
  let called = 0;

  const $el = $d(el).onIntersect(function (entry, target) {
    called++;
    assert.equal(this, target);
    assert.equal(target, el);
    assert.ok(entry);
  });

  assert.ok(Array.isArray($el._observers));
  assert.equal($el._observers.length, 1);

  const obs = FakeIntersectionObserver.instances[0];
  assert.ok(obs);
  assert.equal(obs.observed[0], el);

  // Simulate an intersection event.
  obs.cb([{ target: el, isIntersecting: true }]);
  assert.equal(called, 1);

  // Ensure unobserve() can clean it up
  $el.unobserve();
  assert.equal($el._observers.length, 0);
  assert.equal(obs.disconnected, true);
});
