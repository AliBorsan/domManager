const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("animateKeyframes()/pauseAnimation()/resumeAnimation()/cancelAnimation()", () => {
  const { document, $d } = loadDomMan(
    "<!doctype html><html><body><div id='a'></div></body></html>"
  );

  const el = document.getElementById("a");

  const calls = [];

  el.animate = function (_keyframes, _options) {
    return {
      pause() {
        calls.push("pause");
      },
      play() {
        calls.push("play");
      },
      cancel() {
        calls.push("cancel");
      },
      onfinish: null,
      oncancel: null,
    };
  };

  const $el = $d(el).animateKeyframes([{ opacity: 0 }, { opacity: 1 }], {
    duration: 123,
    onComplete() {
      calls.push(`complete:${this.id}`);
    },
  });

  assert.ok($el._animations);
  const anim = $el._animations.get(el);
  assert.ok(anim);

  anim.onfinish();
  assert.ok(calls.includes("complete:a"));

  $el.pauseAnimation();
  $el.resumeAnimation();
  $el.cancelAnimation();

  assert.ok(calls.includes("pause"));
  assert.ok(calls.includes("play"));
  assert.ok(calls.includes("cancel"));
  assert.equal($el._animations.size, 0);
});
