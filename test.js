/* global require:true */
/* jshint strict:false */

var assert = require("assert");

//--------------------------------------------------------------------

// Similar to http://underscorejs.org/#extend
var extend = (function () {
  var hasOwn = Object.prototype.hasOwnProperty;
  hasOwn = hasOwn.call.bind(hasOwn);

  return function (dest, source) {
    var i, n, property;

    for (i = 1, n = arguments.length; i < n; ++i) {
      source = arguments[i];
      for (property in source) {
        if (hasOwn(source, property)) {
          dest[property] = source[property];
        }
      }
    }

    return dest;
  };
})();

//====================================================================

var spyPlugin = function () {
  return [].concat.apply([this], arguments);
};

var gulpLoadPlugins = (function () {
  var wrapInFunc = function (value) {
    return function () {
      return value;
    };
  };

  var proxyquire = require("proxyquire").noCallThru();

  return proxyquire("./index.js", {
    "gulp-foo": wrapInFunc({ name: "foo" }),
    "gulp-bar": wrapInFunc({ name: "bar" }),
    "gulp-foo-bar": wrapInFunc({ name: "foo-bar" }),
    "gulp-spy": spyPlugin,
    "jack-foo": wrapInFunc({ name: "jack-foo" }),
  });
})();

//====================================================================

// Contains common tests.
//
// Only the configuration
var commonTests = function (options) {
  it("loads things in", function() {
    var x = gulpLoadPlugins(extend({
      config: {
        dependencies: {
          "gulp-foo": "1.0.0",
          "gulp-bar": "*"
        }
      }
    }, options));

    assert.deepEqual(x.foo(), {
      name: "foo"
    });
    assert.deepEqual(x.bar(), {
      name: "bar"
    });
  });

  it("can take a pattern override", function() {
    var x = gulpLoadPlugins(extend({
      pattern: "jack-*",
      replaceString: "jack-",
      config: {
        dependencies: {
          "jack-foo": "1.0.0",
          "gulp-bar": "*"
        }
      }
    }, options));

    assert.deepEqual(x.foo(), {
      name: "jack-foo"
    });
    assert(!x.bar);
  });

  it("allows camelizing to be turned off", function() {
    var x = gulpLoadPlugins(extend({
      camelize: false,
      config: {
        dependencies: {
          "gulp-foo-bar": "*"
        }
      }
    }, options));

    assert.deepEqual(x["foo-bar"](), {
      name: "foo-bar"
    });
  });

  it("camelizes plugins name by default", function () {
    var x = gulpLoadPlugins(extend({
      config: {
        dependencies: {
          "gulp-foo-bar": "*"
        }
      }
    }, options));

    assert.deepEqual(x.fooBar(), {
      name: "foo-bar"
    });
  });
};

//--------------------------------------------------------------------

describe("loading plugins", function() {
  describe("greedily", function () {
    commonTests({
      lazy: false,
    });
  });

  describe("lazily", function () {
    commonTests({
      lazy: true,
    });

    it('should not require plugin before use', function () {
      var $ = gulpLoadPlugins({
        lazy: true,
        config: {
          dependencies: {
            "gulp-spy": "*"
          }
        }
      });

      // The current value is not the plugin.
      assert.notEqual($.spy, spyPlugin);
    });

    it('should proxy context and arguments', function () {
      var $ = gulpLoadPlugins({
        lazy: true,
        config: {
          dependencies: {
            "gulp-spy": "*"
          }
        }
      });

      // When called, context and arguments are proxied.
      var context = {};
      var arg1 = {};
      var arg2 = {};
      var result = $.spy.call(context, arg1, arg2);

      assert.equal(context, result[0]);
      assert.equal(arg1, result[1]);
      assert.equal(arg2, result[2]);
    });

    it('once called, the plugin should be directly available', function () {
      var $ = gulpLoadPlugins({
        lazy: true,
        config: {
          dependencies: {
            "gulp-spy": "*"
          }
        }
      });

      $.spy();

      // Now it is the plugin.
      assert.equal($.spy, spyPlugin);
    });
  });
});
