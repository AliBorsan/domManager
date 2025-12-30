const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

class FakeXMLHttpRequest {
  static queue = [];
  static instances = [];

  constructor() {
    this.status = 0;
    this.statusText = "";
    this.responseText = "";

    this.onload = null;
    this.onerror = null;

    FakeXMLHttpRequest.instances.push(this);
  }

  open(method, url, async) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  send(data) {
    this.data = data;

    const next = FakeXMLHttpRequest.queue.shift() || {
      type: "load",
      status: 200,
      responseText: "OK",
    };

    queueMicrotask(() => {
      this.status = next.status;
      this.statusText = next.statusText || "";
      this.responseText = next.responseText || "";

      if (next.type === "error") {
        if (typeof this.onerror === "function") this.onerror();
        return;
      }

      if (typeof this.onload === "function") this.onload();
    });
  }
}

test("serializeForm(): object/json/urlencoded + multi-value keys", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f'>" +
      "  <input name='a' value='1'/>" +
      "  <input type='checkbox' name='multi' value='x' checked/>" +
      "  <input type='checkbox' name='multi' value='y' checked/>" +
      "</form>" +
      "</body></html>"
  );

  const obj = $d("#f").serializeForm("object");
  const normalizedObj = JSON.parse(JSON.stringify(obj));
  assert.deepEqual(normalizedObj, { a: "1", multi: ["x", "y"] });

  const json = $d("#f").serializeForm("json");
  assert.deepEqual(JSON.parse(json), normalizedObj);

  const encoded = $d("#f").serializeForm("urlencoded");
  const parts = encoded.split("&").sort();
  assert.deepEqual(parts, ["a=1", "multi=x", "multi=y"].sort());

  assert.doesNotThrow(() => {
    const div = document.createElement("div");
    $d(div).serializeForm("object");
  });
});

test("formValue(): gets/sets field, checkbox, radio", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f'>" +
      "  <input name='a' value='1'/>" +
      "  <input type='checkbox' name='agree' checked/>" +
      "  <input type='radio' name='r' value='one' checked/>" +
      "  <input type='radio' name='r' value='two'/>" +
      "</form>" +
      "</body></html>"
  );

  assert.equal($d("#f").formValue("a"), "1");
  $d("#f").formValue("a", "2");
  assert.equal(document.querySelector("input[name='a']").value, "2");

  assert.equal($d("#f").formValue("agree"), true);
  $d("#f").formValue("agree", false);
  assert.equal(document.querySelector("input[name='agree']").checked, false);

  assert.equal($d("#f").formValue("r"), "one");
  $d("#f").formValue("r", "two");
  assert.equal($d("#f").formValue("r"), "two");
});

test("resetForm(): restores default values", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f'>" +
      "  <input name='a' value='1'/>" +
      "  <input type='checkbox' name='agree' checked/>" +
      "</form>" +
      "</body></html>"
  );

  const a = document.querySelector("input[name='a']");
  const agree = document.querySelector("input[name='agree']");

  a.value = "9";
  agree.checked = false;

  $d("#f").resetForm();

  assert.equal(a.value, "1");
  assert.equal(agree.checked, true);
});

test("validate(): required + pattern + blur validation", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f'>" +
      "  <div><input name='user' value='ok'/></div>" +
      "  <div><input name='email' value='a@b.com'/></div>" +
      "</form>" +
      "</body></html>"
  );

  const rules = {
    user: { required: true },
    email: { pattern: /.+@.+\..+/ },
  };

  const res1 = $d("#f").validate(rules, { showErrors: true, validateOnBlur: true });
  assert.equal(res1.valid, true);

  const user = document.querySelector("input[name='user']");
  user.value = "";
  user.dispatchEvent(new document.defaultView.Event("blur", { bubbles: true }));

  const err = document.querySelector(".error-message[data-for='user']");
  assert.ok(err);
  assert.equal(user.classList.contains("error"), true);

  const res2 = $d("#f").validate(rules, { showErrors: false });
  assert.equal(res2.valid, false);
  assert.equal(typeof res2.errors.user, "string");
});

test("submitForm(true): uses XHR and invokes callback", async () => {
  const { window, document, $d } = loadDomMan(
    "<!doctype html><html><body>" +
      "<form id='f' action='/submit' method='post'>" +
      "  <input name='a' value='1'/>" +
      "</form>" +
      "</body></html>"
  );

  window.XMLHttpRequest = FakeXMLHttpRequest;
  FakeXMLHttpRequest.queue = [
    { type: "load", status: 201, responseText: "CREATED" },
  ];

  const calls = [];
  const expectedUrl = document.getElementById("f").action;

  $d("#f").submitForm(true, (status, responseText, xhr) => {
    calls.push({ status, responseText, method: xhr.method, url: xhr.url });
  });

  await new Promise((r) => setTimeout(r, 0));

  assert.deepEqual(calls, [
    { status: 201, responseText: "CREATED", method: "POST", url: expectedUrl },
  ]);

  const xhr = FakeXMLHttpRequest.instances.at(-1);
  assert.equal(xhr.data instanceof window.FormData, true);
});
