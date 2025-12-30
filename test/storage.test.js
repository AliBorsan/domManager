const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("localStorage helpers: set/get/remove/clear", () => {
  const { window, $d } = loadDomMan();

  window.localStorage.clear();

  $d().setLocalStorage("k", { a: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify($d().getLocalStorage("k"))), { a: 1 });

  $d().removeLocalStorage("k");
  assert.equal(window.localStorage.getItem("k"), null);

  $d().setLocalStorage("k2", [1, 2, 3]);
  assert.deepEqual(JSON.parse(JSON.stringify($d().getLocalStorage("k2"))), [1, 2, 3]);

  $d().clearLocalStorage();
  assert.equal(window.localStorage.length, 0);
});

test("localStorage helpers: invalid key does not throw", () => {
  const { $d } = loadDomMan();

  assert.doesNotThrow(() => {
    $d().setLocalStorage(null, 1);
  });

  assert.doesNotThrow(() => {
    $d().removeLocalStorage(undefined);
  });

  assert.equal($d().getLocalStorage(123), null);
});
