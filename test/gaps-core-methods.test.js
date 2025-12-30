const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("css(): sets inline style on all matched elements", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  $d(".x").css("color", "red");

  const nodes = Array.from(document.querySelectorAll(".x"));
  assert.equal(nodes.length, 2);
  assert.ok(String(nodes[0].style.color).length > 0);
  assert.ok(String(nodes[1].style.color).length > 0);
});

test("html(): getter reads first, setter sets all", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  $d(".x").html("<span>hi</span>");

  const nodes = Array.from(document.querySelectorAll(".x"));
  assert.equal(nodes[0].innerHTML, "<span>hi</span>");
  assert.equal(nodes[1].innerHTML, "<span>hi</span>");

  assert.equal($d(".x").html(), "<span>hi</span>");
});

test("text(): getter reads first, setter sets all", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  $d(".x").text("hello");

  const nodes = Array.from(document.querySelectorAll(".x"));
  // jsdom supports innerText; verify it’s set on both.
  assert.equal(nodes[0].innerText, "hello");
  assert.equal(nodes[1].innerText, "hello");

  assert.equal($d(".x").text(), "hello");
});

test("append(): appends Node and clones for multi targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='t'></div><div class='t'></div></body></html>"
  );

  const span = document.createElement("span");
  span.textContent = "x";

  $d(".t").append(span);

  const targets = Array.from(document.querySelectorAll(".t"));
  assert.equal(targets[0].querySelectorAll("span").length, 1);
  assert.equal(targets[1].querySelectorAll("span").length, 1);

  const s1 = targets[0].querySelector("span");
  const s2 = targets[1].querySelector("span");
  assert.ok(s1);
  assert.ok(s2);
  assert.notEqual(s1, s2);
});

test("appendTo(): moves sources into first target and clones for additional targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='dst' id='d1'></div>" +
      "<div class='dst' id='d2'></div>" +
      "<span class='src' id='s1'></span>" +
      "<span class='src' id='s2'></span>" +
      "</body></html>"
  );

  const s1 = document.getElementById("s1");
  const s2 = document.getElementById("s2");

  $d(".src").appendTo($d(".dst"));

  const d1 = document.getElementById("d1");
  const d2 = document.getElementById("d2");

  const d1Spans = Array.from(d1.querySelectorAll("span"));
  const d2Spans = Array.from(d2.querySelectorAll("span"));

  assert.equal(d1Spans.length, 2);
  assert.equal(d2Spans.length, 2);

  // First target gets the original nodes (moved).
  assert.ok(d1Spans.includes(s1));
  assert.ok(d1Spans.includes(s2));

  // Second target gets clones.
  assert.notEqual(d2Spans[0], s1);
  assert.notEqual(d2Spans[1], s2);
});

test("prependTo(): preserves source order and clones for additional targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='dst' id='d1'></div>" +
      "<div class='dst' id='d2'></div>" +
      "<span class='src' id='s1'>1</span>" +
      "<span class='src' id='s2'>2</span>" +
      "</body></html>"
  );

  const s1 = document.getElementById("s1");
  const s2 = document.getElementById("s2");

  $d(".src").prependTo($d(".dst"));

  const d1 = document.getElementById("d1");
  const d2 = document.getElementById("d2");

  assert.equal(d1.firstChild, s1);
  assert.equal(d1.lastChild, s2);

  const d2Spans = Array.from(d2.querySelectorAll("span"));
  assert.equal(d2Spans.length, 2);
  assert.equal(d2Spans[0].textContent, "1");
  assert.equal(d2Spans[1].textContent, "2");
  assert.notEqual(d2Spans[0], s1);
  assert.notEqual(d2Spans[1], s2);
});

test("remove(): removes all matched elements from DOM", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  assert.equal(document.querySelectorAll(".x").length, 2);

  const ret = $d(".x").remove();
  assert.ok(ret && typeof ret === "object");

  assert.equal(document.querySelectorAll(".x").length, 0);
});

test("clone(true): deep clones a single element", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'><span>hi</span></div></body></html>"
  );

  const original = document.getElementById("a");
  const cloned = $d("#a").clone(true);

  assert.ok(cloned);
  assert.notEqual(cloned, original);
  assert.equal(cloned.querySelector("span").textContent, "hi");
});

test("clone(true): returns an array for multi selection", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  const originals = Array.from(document.querySelectorAll(".x"));
  const cloned = $d(".x").clone(true);

  assert.ok(Array.isArray(cloned));
  assert.equal(cloned.length, 2);
  assert.notEqual(cloned[0], originals[0]);
  assert.notEqual(cloned[1], originals[1]);
});

test("replaceWith(): replaces each matched element; clones for multi targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  const repl = document.createElement("span");
  repl.className = "r";
  repl.textContent = "ok";

  $d(".x").replaceWith(repl);

  const spans = Array.from(document.querySelectorAll("span.r"));
  assert.equal(spans.length, 2);
  assert.notEqual(spans[0], spans[1]);
});

test("onReady()/ready(): invokes callback (immediate or DOMContentLoaded)", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body></body></html>"
  );

  const tryForceLoading = () => {
    try {
      Object.defineProperty(document, "readyState", {
        configurable: true,
        get: () => "loading",
      });
      return true;
    } catch {
      return false;
    }
  };

  const forced = tryForceLoading();

  // onReady
  let calledOnReady = 0;
  $d().onReady(() => {
    calledOnReady++;
  });
  if (forced) {
    assert.equal(calledOnReady, 0);
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }
  assert.equal(calledOnReady, 1);

  // ready
  let calledReady = 0;
  $d().ready(() => {
    calledReady++;
  });
  if (forced) {
    // dispatching again should increment again since we registered a new listener
    document.dispatchEvent(new window.Event("DOMContentLoaded"));
  }
  assert.equal(calledReady, 1);
});

test("setDebugMode(): toggles domMan.debugMode and returns domMan", () => {
  const { $d } = loadDomMan();

  const r1 = $d.setDebugMode(true);
  assert.equal($d.debugMode, true);
  assert.equal(r1, $d);

  const r2 = $d.setDebugMode(false);
  assert.equal($d.debugMode, false);
  assert.equal(r2, $d);
});
