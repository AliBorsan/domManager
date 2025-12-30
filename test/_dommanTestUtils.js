const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

function loadDomMan(
  html = "<!doctype html><html><head></head><body></body></html>",
  options = {}
) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/",
  });

  if (options && typeof options.beforeEval === "function") {
    options.beforeEval(dom);
  }

  const source = fs.readFileSync(
    path.join(__dirname, "..", "domman.js"),
    "utf8"
  );

  dom.window.eval(source);

  const $d = dom.window.$d;
  const domMan = dom.window.domMan;
  assert.equal(typeof $d, "function");
  assert.equal(typeof domMan, "function");

  return { dom, window: dom.window, document: dom.window.document, $d, domMan };
}

module.exports = { loadDomMan };
