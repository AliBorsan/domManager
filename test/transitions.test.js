const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("addClassWithTransition(): applies class and restores original transition", async () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  const el = document.getElementById("a");
  el.style.transition = "opacity 1s";

  $d(el).addClassWithTransition("x", 10);

  assert.equal(el.classList.contains("x"), true);
  assert.ok(el.style.transition.includes("10ms"));

  await new Promise((r) => setTimeout(r, 25));

  assert.equal(el.style.transition, "opacity 1s");
});
