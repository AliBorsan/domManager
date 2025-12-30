const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("fadeIn(): sets display block and animates opacity upward", async () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a' style='display:none;opacity:0'></div></body></html>"
  );

  const el = document.getElementById("a");

  $d(el).fadeIn(10);

  assert.equal(el.style.display, "block");

  await new Promise((r) => setTimeout(r, 30));

  const opacity = parseFloat(el.style.opacity);
  assert.ok(opacity >= 0);
});
