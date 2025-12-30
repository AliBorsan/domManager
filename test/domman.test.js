const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

function loadDomMan(html = "<!doctype html><html><head></head><body></body></html>") {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.test/" });
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

test("library loads and exposes $d/domMan", () => {
  const { $d, domMan } = loadDomMan();
  assert.equal($d, domMan);
});

test("delegate uses closest/contains (basic functionality)", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='root'><button class='btn'><span id='inner'>X</span></button></div></body></html>"
  );

  const root = document.getElementById("root");
  const inner = document.getElementById("inner");

  let calledWith = null;
  $d(root).delegate(".btn", "click", function () {
    calledWith = this;
  });

  inner.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true }));

  assert.ok(calledWith);
  assert.equal(calledWith.classList.contains("btn"), true);
});

test("Proxy collision: .click() triggers click; .click(fn) binds handler", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><button id='b'>B</button></body></html>"
  );

  const btn = document.getElementById("b");

  let count = 0;
  // Bind via proxy shortcut
  $d(btn).click(() => {
    count += 1;
  });

  // Trigger via proxy shortcut (no args)
  $d(btn).click();

  assert.equal(count, 1);
});

test("off() removes event listeners", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><button id='b'>B</button></body></html>"
  );

  const btn = document.getElementById("b");

  let count = 0;
  function handler() {
    count += 1;
  }

  $d(btn).on("click", handler);
  btn.click();
  assert.equal(count, 1);

  $d(btn).off("click", handler);
  btn.click();
  assert.equal(count, 1);
});

test("multi selector: val() sets all, getter reads first", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><input class='i' value='a'/><input class='i' value='b'/></body></html>"
  );

  $d(".i").val("z");
  const inputs = document.querySelectorAll(".i");
  assert.equal(inputs[0].value, "z");
  assert.equal(inputs[1].value, "z");
  assert.equal($d(".i").val(), "z");
});

test("multi selector: class methods apply to all", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='c'></div><div class='c'></div></body></html>"
  );

  $d(".c").addClass("x");
  const els = document.querySelectorAll(".c");
  assert.equal(els[0].classList.contains("x"), true);
  assert.equal(els[1].classList.contains("x"), true);

  $d(".c").toggleClass("x");
  assert.equal(els[0].classList.contains("x"), false);
  assert.equal(els[1].classList.contains("x"), false);
});

test("multi selector: data(key,value) sets all; data(key) reads first", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='d'></div><div class='d'></div></body></html>"
  );

  $d(".d").data("k", "v");
  assert.equal($d(".d").data("k"), "v");

  const els = document.querySelectorAll(".d");
  assert.equal($d(els[0]).data("k"), "v");
  assert.equal($d(els[1]).data("k"), "v");
});

test("traversal: parent() returns unique parents for multi selection", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='p1'><span class='c' id='c1'></span></div>" +
      "<div id='p2'><span class='c' id='c2'></span></div>" +
      "</body></html>"
  );

  const parents = $d(".c").parent()._getElementArray();
  assert.equal(parents.length, 2);
  assert.equal(parents[0].id, "p1");
  assert.equal(parents[1].id, "p2");
});

test("traversal: children() flattens children across multi selection", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='p' id='p1'><span class='x' id='x1'></span><span class='x' id='x2'></span></div>" +
      "<div class='p' id='p2'><span class='x' id='x3'></span></div>" +
      "</body></html>"
  );

  const kids = $d(".p").children()._getElementArray();
  assert.equal(kids.length, 3);
  assert.equal(kids[0].id, "x1");
  assert.equal(kids[1].id, "x2");
  assert.equal(kids[2].id, "x3");

  // Sanity check: elements exist
  assert.ok(document.getElementById("x1"));
});

test("traversal: siblings() on multi selection excludes all selected", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul>" +
      "<li class='i' id='a'></li>" +
      "<li class='i' id='b'></li>" +
      "<li id='c'></li>" +
      "</ul>" +
      "</body></html>"
  );

  const sibs = $d(".i").siblings()._getElementArray();
  assert.equal(sibs.length, 1);
  assert.equal(sibs[0].id, "c");
});

test("traversal: next()/prev() return unions for multi selection", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div>" +
      "<span class='i' id='a'></span>" +
      "<span id='b'></span>" +
      "<span class='i' id='c'></span>" +
      "<span id='d'></span>" +
      "</div>" +
      "</body></html>"
  );

  const nexts = $d(".i").next()._getElementArray();
  assert.equal(nexts.length, 2);
  assert.equal(nexts[0].id, "b");
  assert.equal(nexts[1].id, "d");

  const prevs = $d(".i").prev()._getElementArray();
  assert.equal(prevs.length, 1);
  assert.equal(prevs[0].id, "b");
});

test("insertion: before()/after() clone nodes for multi targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='t' id='t1'></div>" +
      "<div class='t' id='t2'></div>" +
      "</body></html>"
  );

  const beforeNode = document.createElement("i");
  beforeNode.className = "m-before";
  $d(".t").before(beforeNode);
  assert.equal(document.querySelectorAll("i.m-before").length, 2);
  assert.equal(document.body.children[0].className, "m-before");
  assert.equal(document.body.children[1].id, "t1");
  assert.equal(document.body.children[2].className, "m-before");
  assert.equal(document.body.children[3].id, "t2");

  const afterNode = document.createElement("i");
  afterNode.className = "m-after";
  $d(".t").after(afterNode);
  assert.equal(document.querySelectorAll("i.m-after").length, 2);

  // After insertion: t1, m-after, t2, m-after (with existing before markers earlier)
  const ids = Array.from(document.body.children).map((n) => n.id || n.className);
  assert.deepEqual(ids, ["m-before", "t1", "m-after", "m-before", "t2", "m-after"]);
});

test("cssObject works on array-backed selections (e.g. traversal results)", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='p' id='p1'><span class='c'></span></div>" +
      "<div class='p' id='p2'><span class='c'></span></div>" +
      "</body></html>"
  );

  // parent() returns a wrapped array
  $d(".c").parent().cssObject({ color: "red" });

  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  assert.equal(p1.style.color, "red");
  assert.equal(p2.style.color, "red");
});

test("animate() applies to all matched elements (multi selection)", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='a' id='a1'></div>" +
      "<div class='a' id='a2'></div>" +
      "</body></html>"
  );

  $d(".a").animate({ opacity: "0.5" }, 123, "linear");

  const a1 = document.getElementById("a1");
  const a2 = document.getElementById("a2");
  assert.ok(a1.style.transition.includes("123ms"));
  assert.ok(a2.style.transition.includes("123ms"));
  assert.equal(a1.style.opacity, "0.5");
  assert.equal(a2.style.opacity, "0.5");
});

test("hover()/removeHover() stores handler refs and removes them", () => {
  const { document, window, $d } = loadDomMan(
    "<!doctype html><html><body><button id='b'></button></body></html>"
  );

  const b = document.getElementById("b");
  let enterCount = 0;
  let leaveCount = 0;

  function onEnter() {
    enterCount += 1;
  }

  function onLeave() {
    leaveCount += 1;
  }

  $d(b).hover(onEnter, onLeave);
  b.dispatchEvent(new window.Event("mouseenter"));
  b.dispatchEvent(new window.Event("mouseleave"));
  assert.equal(enterCount, 1);
  assert.equal(leaveCount, 1);

  $d(b).removeHover();
  b.dispatchEvent(new window.Event("mouseenter"));
  b.dispatchEvent(new window.Event("mouseleave"));
  assert.equal(enterCount, 1);
  assert.equal(leaveCount, 1);
});

test("cssHover/removeCssHover work on multi selection", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='h'></div><div class='h'></div>" +
      "</body></html>"
  );

  $d(".h").cssHover({ color: "red" }, { color: "blue" });
  const els = Array.from(document.querySelectorAll(".h"));
  assert.equal(els.length, 2);
  assert.ok(els[0].className.includes("domman-pseudo-"));
  assert.ok(els[1].className.includes("domman-pseudo-"));

  $d(".h").removeCssHover();
  assert.equal(els[0].className.includes("domman-pseudo-"), false);
  assert.equal(els[1].className.includes("domman-pseudo-"), false);
});

test("isEmpty() uses first-element semantics even for array-backed selections", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='p' id='p1'><span class='c'>x</span></div>" +
      "<div class='p' id='p2'><span class='c'></span></div>" +
      "</body></html>"
  );

  // parent() returns array-backed selection of parents
  const parents = $d(".c").parent();
  assert.equal(parents.isEmpty(), false);
});

test("appendChild clones nodes for multi targets", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='t' id='t1'></div>" +
      "<div class='t' id='t2'></div>" +
      "</body></html>"
  );

  const span = document.createElement("span");
  span.className = "x";
  span.textContent = "hi";

  $d(".t").appendChild(span);
  assert.equal(document.querySelectorAll("#t1 span.x").length, 1);
  assert.equal(document.querySelectorAll("#t2 span.x").length, 1);
});

test("getAttribute/setAttribute/removeAttribute/hasAttribute support multi selections", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='a' id='a1'></div>" +
      "<div class='a' id='a2'></div>" +
      "</body></html>"
  );

  $d(".a").setAttribute("data-k", "v");
  assert.equal(document.getElementById("a1").getAttribute("data-k"), "v");
  assert.equal(document.getElementById("a2").getAttribute("data-k"), "v");
  assert.equal($d(".a").getAttribute("data-k"), "v");
  assert.equal($d(".a").hasAttribute("data-k"), true);

  $d(".a").removeAttribute("data-k");
  assert.equal($d(".a").hasAttribute("data-k"), false);
});

test("Proxy CSS property setter works on array-backed selections", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='p1'><span class='c'></span></div>" +
      "<div id='p2'><span class='c'></span></div>" +
      "</body></html>"
  );

  // parent() returns array-backed selection
  $d(".c").parent().color("red");

  assert.equal(document.getElementById("p1").style.color, "red");
  assert.equal(document.getElementById("p2").style.color, "red");
});

test("Proxy DOM property getter/setter works on array-backed selections", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='p1'><span class='c'></span></div>" +
      "<div id='p2'><span class='c'></span></div>" +
      "</body></html>"
  );

  const parents = $d(".c").parent();
  assert.equal(parents.id(), "p1");

  parents.className("zz");
  assert.equal(document.getElementById("p1").className, "zz");
  assert.equal(document.getElementById("p2").className, "zz");
});

test("Proxy overlap: src() uses DOM property when present, otherwise CSS", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='dv'></div>" +
      "<img id='im'/>" +
      "</body></html>"
  );

  const dv = document.getElementById("dv");
  assert.equal(Object.prototype.hasOwnProperty.call(dv, "src"), false);
  assert.equal(dv.getAttribute("src"), null);

  $d("#dv").src("style-src");
  // Should not create an expando DOM property or an attribute on elements
  // that don't actually support the property.
  assert.equal(Object.prototype.hasOwnProperty.call(dv, "src"), false);
  assert.equal(dv.getAttribute("src"), null);

  $d("#im").src("images/1.jpg");
  assert.equal(document.getElementById("im").getAttribute("src"), "images/1.jpg");
});

test("Proxy overlap: volume() uses DOM property when present, otherwise CSS", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='dv'></div>" +
      "<audio id='au'></audio>" +
      "</body></html>"
  );

  const dv = document.getElementById("dv");
  assert.equal(Object.prototype.hasOwnProperty.call(dv, "volume"), false);

  $d("#dv").volume("0.5");
  // Should not create an expando DOM property on elements without volume.
  assert.equal(Object.prototype.hasOwnProperty.call(dv, "volume"), false);

  $d("#au").volume(0.25);
  assert.equal(document.getElementById("au").volume, 0.25);
});

test("Proxy overlap: translate() uses DOM property when present, otherwise avoids expandos", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='dv'>x</div>" +
      "<svg id='sv'></svg>" +
      "</body></html>"
  );

  const dv = document.getElementById("dv");
  assert.equal("translate" in dv, true);
  $d("#dv").translate(false);
  assert.equal(dv.translate, false);

  const sv = document.getElementById("sv");
  assert.equal("translate" in sv, false);
  assert.equal(Object.prototype.hasOwnProperty.call(sv, "translate"), false);
  $d("#sv").translate(false);
  // Should not create an expando DOM property.
  assert.equal(Object.prototype.hasOwnProperty.call(sv, "translate"), false);
});

test("length property reflects matched element count", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='x' id='x1'></div>" +
      "<div class='x' id='x2'></div>" +
      "</body></html>"
  );

  assert.equal($d().length, 0);

  assert.equal($d("#x1").length, 1);
  assert.equal($d(".x").length, 2);
  assert.equal($d(".missing").length, 0);

  const x1 = document.getElementById("x1");
  const x2 = document.getElementById("x2");
  assert.equal($d(x1).length, 1);
  assert.equal($d([x1, x2]).length, 2);
  assert.equal($d(document.querySelectorAll(".x")).length, 2);
});

test("findOne() returns a wrapped single match", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='root'><span class='a'></span><span class='b'></span></div>" +
      "</body></html>"
  );

  const one = $d("#root").findOne(".b");
  assert.equal(one.length, 1);
  assert.equal(one.hasClass("b"), true);

  const none = $d("#root").findOne(".missing");
  assert.equal(none.length, 0);
});

test("tap() runs in chain and returns same instance", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body><div class='x'></div><div class='x'></div></body></html>"
  );

  let seenLength = -1;
  const inst = $d(".x");
  const out = inst.tap((self) => {
    seenLength = self.length;
  });

  assert.equal(out, inst);
  assert.equal(seenLength, 2);
});

test("toArray()/asArray() return normalized element arrays", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div class='x' id='x1'></div><div class='x' id='x2'></div></body></html>"
  );

  const arr = $d(".x").toArray();
  assert.equal(Array.isArray(arr), true);
  assert.equal(arr.length, 2);
  assert.equal(arr[0], document.getElementById("x1"));

  const arr2 = $d(".x").asArray();
  assert.equal(Array.isArray(arr2), true);
  assert.equal(arr2.length, 2);
});

test("cssVar supports names with and without leading --", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='x'></div></body></html>"
  );

  $d("#x").cssVar("accent", "red");
  assert.equal(
    document.getElementById("x").style.getPropertyValue("--accent"),
    "red"
  );

  $d("#x").cssVar("--accent", "blue");
  assert.equal(
    document.getElementById("x").style.getPropertyValue("--accent"),
    "blue"
  );
});

test("on(event, selector, handler) delegates and binds this to matched", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let called = 0;
  let thisId = "";

  $d("#list").on("click", "li", function () {
    called += 1;
    thisId = this.id;
  });

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );

  assert.equal(called, 1);
  assert.equal(thisId, "a");
});

test("off(event, selector, handler) removes delegated listeners", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let called = 0;
  function handler() {
    called += 1;
  }

  const list = $d("#list");
  list.on("click", "li", handler);

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(called, 1);

  list.off("click", "li", handler);
  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(called, 1);
});

test("one(event, handler) runs at most once", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><button id='b'>b</button></body></html>"
  );

  let called = 0;
  $d("#b").one("click", () => {
    called += 1;
  });

  document.getElementById("b").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  document.getElementById("b").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );

  assert.equal(called, 1);
});

test("one(event, selector, handler) runs at most once (delegated)", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let called = 0;
  $d("#list").one("click", "li", () => {
    called += 1;
  });

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );

  assert.equal(called, 1);
});

test("trigger(event, detail) dispatches CustomEvent with detail", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body><div id='x'></div></body></html>"
  );

  let seen;
  $d("#x").on("hello", (e) => {
    seen = e.detail;
  });

  $d("#x").trigger("hello", { a: 1 });
  assert.deepEqual(seen, { a: 1 });
});

test("triggerHandler does not bubble and targets only first element", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div id='p'><span class='c' id='c1'></span><span class='c' id='c2'></span></div>" +
      "</body></html>"
  );

  let parentCalled = 0;
  document.getElementById("p").addEventListener("hi", () => {
    parentCalled += 1;
  });

  let childCalled = 0;
  document.getElementById("c1").addEventListener("hi", () => {
    childCalled += 1;
  });
  document.getElementById("c2").addEventListener("hi", () => {
    childCalled += 1;
  });

  $d(".c").triggerHandler("hi");
  assert.equal(childCalled, 1);
  assert.equal(parentCalled, 0);
});

test("off(evt) removes all delegated handlers for that event", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let called = 0;
  const list = $d("#list");
  list.on("click", "li", () => {
    called += 1;
  });

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(called, 1);

  list.off("click");
  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(called, 1);
});

test("off(evt, selector) removes delegated handlers for selector", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let calledLi = 0;
  let calledSpan = 0;
  const list = $d("#list");

  list.on("click", "li", () => {
    calledLi += 1;
  });
  list.on("click", "span", () => {
    calledSpan += 1;
  });

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(calledLi, 1);
  assert.equal(calledSpan, 1);

  list.off("click", "li");
  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );

  assert.equal(calledLi, 1);
  assert.equal(calledSpan, 2);
});

test("namespaced delegated events: on('click.menu') and off('.menu')", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<ul id='list'><li id='a'><span id='inner'></span></li></ul>" +
      "</body></html>"
  );

  let menuCalled = 0;
  let otherCalled = 0;

  $d("#list").on("click.menu", "li", () => {
    menuCalled += 1;
  });
  $d("#list").on("click.other", "li", () => {
    otherCalled += 1;
  });

  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );
  assert.equal(menuCalled, 1);
  assert.equal(otherCalled, 1);

  // Remove only the .menu namespace
  $d("#list").off(".menu");
  document.getElementById("inner").dispatchEvent(
    new document.defaultView.MouseEvent("click", { bubbles: true })
  );

  assert.equal(menuCalled, 1);
  assert.equal(otherCalled, 2);
});

test("custom event names containing dots are not treated as namespaces", () => {
  const { $d } = loadDomMan(
    "<!doctype html><html><body><div id='x'></div></body></html>"
  );

  let called = 0;
  $d("#x").on("hello.world", () => {
    called += 1;
  });
  $d("#x").trigger("hello.world");
  assert.equal(called, 1);
});

test("usage regression: createElement + chained css/attrs + appendChild", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body></body></html>"
  );

  const poco = $d().createElement("p");
  $d(poco)
    .textContent("Hello World 222222222")
    .color("red")
    .fontSize("30px")
    .setAttribute("class", "valccccue")
    .setAttribute("data-custom", "value");

  $d(document.body).appendChild(poco);

  const p = document.body.querySelector("p");
  assert.ok(p);
  assert.equal(p.textContent, "Hello World 222222222");
  assert.equal(p.style.color, "red");
  assert.equal(p.style.fontSize, "30px");
  assert.equal(p.getAttribute("class"), "valccccue");
  assert.equal(p.getAttribute("data-custom"), "value");
});

test("usage regression: Proxy CSS + DOM properties + pre() insertion", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<header id='hdr'>Header</header>" +
      "<img id='im'/>" +
      "<a id='lnk'>link</a>" +
      "</body></html>"
  );

  $d("header").backgroundColor("red");
  $d("header").color("white");

  const header = document.querySelector("header");
  assert.equal(header.style.backgroundColor, "red");
  assert.equal(header.style.color, "white");

  // DOM properties (new functionality)
  const myElement = $d().createElement("h2");
  $d(myElement).textContent("Hello World");
  assert.equal(myElement.textContent, "Hello World");

  $d(myElement).innerHTML("<strong>Bold text</strong>").color("blue");

  assert.equal(myElement.innerHTML, "<strong>Bold text</strong>");
  assert.equal(myElement.textContent, "Bold text");
  assert.equal(myElement.style.color, "blue");

  $d(myElement).className("my-class another-class");
  $d(myElement).id("newId");
  assert.equal(myElement.className, "my-class another-class");
  assert.equal(myElement.id, "newId");

  $d("img").src("images/1.jpg");
  $d("a").href("https://example.com");
  assert.ok(document.getElementById("im").src.endsWith("/images/1.jpg"));
  assert.equal(document.getElementById("lnk").href, "https://example.com/");

  // Prepend into body
  $d(document.body).pre(myElement);
  assert.equal(document.body.firstElementChild.id, "newId");
});
