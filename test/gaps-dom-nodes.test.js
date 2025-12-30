const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("createTextNode/createComment/createDocumentFragment(): return correct node types", () => {
  const { document, $d } = loadDomMan();

  const t = $d().createTextNode("hi");
  assert.equal(t.nodeType, document.TEXT_NODE);
  assert.equal(t.nodeValue, "hi");

  const c = $d().createComment("x");
  assert.equal(c.nodeType, document.COMMENT_NODE);
  assert.equal(c.nodeValue, "x");

  const frag = $d().createDocumentFragment();
  assert.equal(frag.nodeType, document.DOCUMENT_FRAGMENT_NODE);
});

test("childNodes/firstChild/lastChild(): reflect first matched element", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'><span></span><!--c--><b></b></div></body></html>"
  );

  const $a = $d("#a");
  const nodes = $a.childNodes();
  assert.ok(Array.isArray(nodes));
  assert.equal(nodes.length, 3);

  assert.equal($a.firstChild(), document.querySelector("#a").firstChild);
  assert.equal($a.lastChild(), document.querySelector("#a").lastChild);
});

test("outerHTML(): getter reads first, setter sets all", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  // Getter
  assert.equal($d(".x").outerHTML(), "<div class=\"x\"></div>");

  // Setter replaces elements
  $d(".x").outerHTML("<p class='y'>ok</p>");

  assert.equal(document.querySelectorAll("div.x").length, 0);
  const ps = Array.from(document.querySelectorAll("p.y"));
  assert.equal(ps.length, 2);
  assert.equal(ps[0].textContent, "ok");
});

test("insertBefore/removeChild/replaceChild(): basic node manipulation", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'><b id='ref'></b></div></body></html>"
  );

  const a = document.getElementById("a");
  const ref = document.getElementById("ref");

  // insertBefore: supports string input (becomes Text node)
  $d(a).insertBefore("X", ref);
  assert.equal(a.firstChild.nodeType, document.TEXT_NODE);
  assert.equal(a.firstChild.nodeValue, "X");

  // replaceChild: supports string input (becomes Text node)
  $d(a).replaceChild("Y", ref);
  // After replacement, last child should be text node "Y".
  assert.equal(a.lastChild.nodeType, document.TEXT_NODE);
  assert.equal(a.lastChild.nodeValue, "Y");

  // removeChild: removes nodes that are actually contained by target
  const first = a.firstChild;
  $d(a).removeChild(first);
  assert.notEqual(a.firstChild, first);
});

test("alternateColors(): applies background colors to table rows", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<table id='t'><tbody>" +
      "<tr id='r1'></tr><tr id='r2'></tr><tr id='r3'></tr>" +
      "</tbody></table>" +
      "</body></html>"
  );

  $d("#t").alternateColors("pink", "cyan");

  const r1 = document.getElementById("r1");
  const r2 = document.getElementById("r2");
  const r3 = document.getElementById("r3");

  assert.equal(r1.style.backgroundColor, "cyan");
  assert.equal(r2.style.backgroundColor, "pink");
  assert.equal(r3.style.backgroundColor, "cyan");
});
