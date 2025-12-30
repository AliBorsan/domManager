const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("cssPseudo(): adds a unique class and injects a CSS rule into #domman-pseudo-styles", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><head></head><body><div class='x'></div><div class='x'></div></body></html>"
  );

  const $x = $d(".x");
  assert.equal($x.length, 2);

  // Ensure a clean baseline
  const existing = document.getElementById("domman-pseudo-styles");
  if (existing) existing.remove();

  $x.cssPseudo(
    "hover",
    { opacity: "0.5" },
    { opacity: "1" },
    { duration: 123, timing: "linear" }
  );

  const styleEl = document.getElementById("domman-pseudo-styles");
  assert.ok(styleEl);
  assert.ok(typeof styleEl.textContent === "string");
  assert.ok(styleEl.textContent.length > 0);

  // The method stores the generated class in data('last-pseudo-class')
  const cls = $x.data("last-pseudo-class");
  assert.ok(typeof cls === "string");
  assert.ok(cls.startsWith("domman-pseudo-"));

  // All matched elements should have the generated class.
  const els = Array.from(document.querySelectorAll(".x"));
  assert.equal(els[0].classList.contains(cls), true);
  assert.equal(els[1].classList.contains(cls), true);

  // Verify the injected CSS includes both base and pseudo rules.
  // (We don't assert exact formatting, only that the selector + key props exist.)
  assert.ok(styleEl.textContent.includes(`.${cls} {`));
  assert.ok(styleEl.textContent.includes("opacity: 1"));
  assert.ok(styleEl.textContent.includes(`transition: all 123ms linear`));

  assert.ok(styleEl.textContent.includes(`.${cls}:hover {`));
  assert.ok(styleEl.textContent.includes("opacity: 0.5"));
});
