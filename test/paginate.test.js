const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("paginate(): renders controls and navigates pages", () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<div class='pagination-controls'></div>" +
      "<div id='out'></div>" +
      "</body></html>"
  );

  const out = document.getElementById("out");
  const calls = [];

  const content = ["a", "b", "c", "d", "e"]; // 3 pages at 2/page

  $d(document.body).paginate(content, 2, (pageContent, page, totalPages) => {
    calls.push({ pageContent: [...pageContent], page, totalPages });
    out.textContent = pageContent.join(",");
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { pageContent: ["a", "b"], page: 1, totalPages: 3 });

  const controls = document.querySelector(".pagination-controls");
  assert.ok(controls);

  const nextBtn = document.querySelector(".pagination-next");
  assert.ok(nextBtn);

  nextBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], { pageContent: ["c", "d"], page: 2, totalPages: 3 });
  assert.equal(out.textContent, "c,d");
  assert.ok(window.location.search.includes("page=2"));

  const lastBtn = document.querySelector(".pagination-last");
  lastBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2], { pageContent: ["e"], page: 3, totalPages: 3 });
  assert.ok(window.location.search.includes("page=3"));

  const firstBtn = document.querySelector(".pagination-first");
  firstBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  assert.equal(calls.length, 4);
  assert.deepEqual(calls[3], { pageContent: ["a", "b"], page: 1, totalPages: 3 });
  assert.ok(window.location.search.includes("page=1"));
});
