const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

class FakeXMLHttpRequest {
  static queue = [];
  static instances = [];

  constructor() {
    this.headers = {};
    this.responseType = "";
    this.status = 0;
    this.statusText = "";
    this.response = null;
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

  setRequestHeader(name, value) {
    this.headers[name] = value;
  }

  send(data) {
    this.data = data;

    const next = FakeXMLHttpRequest.queue.shift() || {
      type: "load",
      status: 200,
      statusText: "OK",
      response: { ok: true },
      responseText: "OK",
    };

    queueMicrotask(() => {
      this.status = next.status;
      this.statusText = next.statusText || "";
      this.response = next.response;
      this.responseText = next.responseText || "";

      if (next.type === "error") {
        if (typeof this.onerror === "function") this.onerror();
        return;
      }

      if (typeof this.onload === "function") this.onload();
    });
  }
}

test("ajax(): resolves on 2xx and returns xhr.response", async () => {
  const { window, $d } = loadDomMan();
  window.XMLHttpRequest = FakeXMLHttpRequest;

  FakeXMLHttpRequest.queue = [
    { type: "load", status: 200, statusText: "OK", response: { a: 1 } },
  ];

  const res = await $d().ajax({
    method: "GET",
    url: "/api",
    headers: { "X-Test": "1" },
    responseType: "json",
  });

  assert.deepEqual(res, { a: 1 });

  const xhr = FakeXMLHttpRequest.instances.at(-1);
  assert.equal(xhr.method, "GET");
  assert.equal(xhr.url, "/api");
  assert.equal(xhr.headers["X-Test"], "1");
  assert.equal(xhr.responseType, "json");
});

test("ajax(): rejects on non-2xx", async () => {
  const { window, $d } = loadDomMan();
  window.XMLHttpRequest = FakeXMLHttpRequest;

  FakeXMLHttpRequest.queue = [
    {
      type: "load",
      status: 500,
      statusText: "Server Error",
      response: { message: "boom" },
    },
  ];

  await assert.rejects(
    () => $d().ajax({ method: "GET", url: "/boom", responseType: "json" }),
    (err) => {
      assert.equal(err.status, 500);
      assert.equal(err.statusText, "Server Error");
      assert.deepEqual(err.response, { message: "boom" });
      return true;
    }
  );
});

test("get()/post() set method and forward options", async () => {
  const { window, $d } = loadDomMan();
  window.XMLHttpRequest = FakeXMLHttpRequest;

  FakeXMLHttpRequest.queue = [
    { type: "load", status: 200, statusText: "OK", response: { ok: 1 } },
    { type: "load", status: 200, statusText: "OK", response: { ok: 2 } },
  ];

  const r1 = await $d().get("/g", null, { headers: { A: "1" } });
  const x1 = FakeXMLHttpRequest.instances.at(-1);
  assert.equal(x1.method, "GET");
  assert.equal(x1.url, "/g");
  assert.deepEqual(r1, { ok: 1 });

  const r2 = await $d().post("/p", "DATA", { headers: { B: "2" } });
  const x2 = FakeXMLHttpRequest.instances.at(-1);
  assert.equal(x2.method, "POST");
  assert.equal(x2.url, "/p");
  assert.equal(x2.data, "DATA");
  assert.deepEqual(r2, { ok: 2 });
});
