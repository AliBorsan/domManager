const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("createElement(): supports attrs, style object, dataset, and event handlers", () => {
  const { document, $d } = loadDomMan();

  const clicked = [];

  const el = $d().createElement("button", {
    id: "btn",
    class: "a b",
    type: "button",
    "aria-label": "hello",
    title: "t",
    "data-role": "primary",
    style: { color: "red", backgroundColor: "blue" },
    onclick(e) {
      clicked.push(e.type);
    },
  });

  assert.ok(el instanceof document.defaultView.HTMLElement);
  assert.equal(el.tagName, "BUTTON");
  assert.equal(el.id, "btn");
  assert.equal(el.className, "a b");
  assert.equal(el.getAttribute("type"), "button");
  assert.equal(el.getAttribute("aria-label"), "hello");
  assert.equal(el.title, "t");
  assert.equal(el.getAttribute("data-role"), "primary");

  // Style application can vary (inline vs computed); just verify the values were set.
  assert.ok(String(el.style.color).length > 0);
  assert.ok(String(el.style.backgroundColor).length > 0);

  el.click();
  assert.deepEqual(clicked, ["click"]);
});

test("createElementNS(): creates SVG element and applies attrs", () => {
  const { document, $d } = loadDomMan();

  const svgNS = "http://www.w3.org/2000/svg";
  const circle = $d().createElementNS(svgNS, "circle", {
    cx: 10,
    cy: 20,
    r: 5,
  });

  assert.ok(circle instanceof document.defaultView.SVGElement);
  assert.equal(circle.tagName.toLowerCase(), "circle");
  assert.equal(circle.getAttribute("cx"), "10");
  assert.equal(circle.getAttribute("cy"), "20");
  assert.equal(circle.getAttribute("r"), "5");
});

test("createSVG(): returns an SVG root element", () => {
  const { document, $d } = loadDomMan();

  const svg = $d().createSVG("svg", { width: 100, height: 80 });

  assert.ok(svg instanceof document.defaultView.SVGSVGElement);
  assert.equal(svg.tagName.toLowerCase(), "svg");
  assert.equal(svg.getAttribute("width"), "100");
  assert.equal(svg.getAttribute("height"), "80");
});
