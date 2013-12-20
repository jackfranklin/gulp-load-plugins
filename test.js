var mocha = require("mocha");
var assert = require("assert");
var proxyquire = require("proxyquire").noCallThru();
var gulpLoadTasks = proxyquire("./index.js", {
  "gulp-foo": { name: "foo" },
  "gulp-bar": { name: "bar" },
  "jack-foo": { name: "jack-foo" },
});

require = function(x) { return "x"; };

describe("loading plugins", function() {
  it("loads things in", function() {
    var x = gulpLoadTasks({
      config: {
        dependencies: {
          "gulp-foo": "1.0.0",
          "gulp-bar": "*"
        }
      }
    });
    assert.deepEqual(x.foo, {
      name: "foo"
    });
    assert.deepEqual(x.bar, {
      name: "bar"
    });

  });

  it("can take a pattern override", function() {
    var x = gulpLoadTasks({
      pattern: "jack-*",
      replaceString: "jack-",
      config: {
        dependencies: {
          "jack-foo": "1.0.0",
          "gulp-bar": "*"
        }
      }
    });
    assert.deepEqual(x.foo, {
      name: "jack-foo"
    });
    assert(!x.bar);
  });
});
