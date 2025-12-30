const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("noConflict(): restores previous globals and returns domMan", () => {
  function prev$d() {}
  function prevDomMan() {}

  const { window, $d, domMan } = loadDomMan(undefined, {
    beforeEval(dom) {
      dom.window.$d = prev$d;
      dom.window.domMan = prevDomMan;
    },
  });

  // Library overwrites globals
  assert.equal(window.$d, domMan);
  assert.equal(window.domMan, domMan);

  const returned = $d().noConflict();

  // Restored
  assert.equal(window.$d, prev$d);
  assert.equal(window.domMan, prevDomMan);

  // Returned function
  assert.equal(returned, domMan);
});

test("noConflict(true): returns isolated clone and restores globals", () => {
  function prev$d() {}
  function prevDomMan() {}

  const { window, document, $d, domMan } = loadDomMan(
    "<!doctype html><html><body><div id='x'></div></body></html>",
    {
      beforeEval(dom) {
        dom.window.$d = prev$d;
        dom.window.domMan = prevDomMan;
      },
    }
  );

  const clone = $d().noConflict(true);

  // Globals restored
  assert.equal(window.$d, prev$d);
  assert.equal(window.domMan, prevDomMan);

  // Clone returned
  assert.equal(typeof clone, "function");
  assert.notEqual(clone, domMan);
  assert.ok(clone.pt);
  assert.notEqual(clone.pt, domMan.pt);

  // Clone still works (selection + core methods)
  assert.equal(clone("#x").length, 1);

  // Extending clone should NOT affect original
  clone().extend({
    onlyOnClone() {
      return "ok";
    },
  });

  assert.equal(typeof clone.pt.onlyOnClone, "function");
  assert.equal(clone().onlyOnClone(), "ok");
  assert.equal(typeof domMan.pt.onlyOnClone, "undefined");

  // Create an element using the clone (no reliance on globals)
  const el = document.createElement("span");
  el.id = "y";
  document.body.appendChild(el);

  assert.equal(clone("#y").length, 1);
});
