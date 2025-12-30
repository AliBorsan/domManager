const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDomMan } = require("./_dommanTestUtils");

test("extend(): adds new methods and does not override existing ones", () => {
  const { $d, domMan } = loadDomMan();

  domMan.pt._unitTestExisting = function () {
    return "existing";
  };

  $d().extend({
    foo() {
      return "foo";
    },
    _unitTestExisting() {
      return "override";
    },
  });

  assert.equal(typeof domMan.pt.foo, "function");
  assert.equal($d().foo(), "foo");

  assert.equal($d()._unitTestExisting(), "existing");
});
