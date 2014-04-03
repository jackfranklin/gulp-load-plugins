var assert = require("assert");

//====================================================================

var gulpLoadPlugins = (function () {
  var wrapInFunc = function (value) {
    return function() {
      return value;
    };
  };

  var proxyquire = require("proxyquire").noCallThru();

  return proxyquire("./index.js", {
    "gulp-foo": wrapInFunc({ name: "foo" }),
    "gulp-bar": wrapInFunc({ name: "bar" }),
    "gulp-foo-bar": wrapInFunc({ name: "foo-bar" }),
    "jack-foo": wrapInFunc({ name: "jack-foo" }),
    "gulp-insert": {
      'append':  wrapInFunc({ name: "insert.append" }),
      'wrap':   wrapInFunc({ name: "insert.wrap" })
    }
  });
})();

//====================================================================

// Contains common tests with and without lazy mode.
var commonTests = function (lazy) {
  it("loads things in", function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: {
        dependencies: {
          "gulp-foo": "1.0.0",
          "gulp-bar": "*",
          "gulp-insert": "*"
        }
      }
    });

    assert.deepEqual(x.foo(), {
      name: "foo"
    });
    assert.deepEqual(x.bar(), {
      name: "bar"
    });
    assert.deepEqual(x.insert.wrap(), {
      name: "insert.wrap"
    });
    assert.deepEqual(x.insert.append(), {
      name: "insert.append"
    });
  });

  it("can take a pattern override", function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      pattern: "jack-*",
      replaceString: "jack-",
      config: {
        dependencies: {
          "jack-foo": "1.0.0",
          "gulp-bar": "*"
        }
      }
    });

    assert.deepEqual(x.foo(), {
      name: "jack-foo"
    });
    assert(!x.bar);
  });

  it("allows camelizing to be turned off", function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      camelize: false,
      config: {
        dependencies: {
          "gulp-foo-bar": "*"
        }
      }
    });

    assert.deepEqual(x["foo-bar"](), {
      name: "foo-bar"
    });
  });

  it("camelizes plugins name by default", function () {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: {
        dependencies: {
          "gulp-foo-bar": "*"
        }
      }
    });

    assert.deepEqual(x.fooBar(), {
      name: "foo-bar"
    });
  });
};

describe('no lazy loading', function() {
  commonTests(false);
});

describe('with lazy loading', function() {
  commonTests(true);
});

