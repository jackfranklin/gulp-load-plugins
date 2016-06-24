'use strict';
var assert = require('assert');
var sinon = require('sinon');
var capture = require('capture-stream');
var path = require('path');

var gulpLoadPlugins = (function() {
  var wrapInFunc = function(value) {
    return function() {
      return value;
    };
  };

  var proxyquire = require('proxyquire').noCallThru();

  return proxyquire('../', {
    'gulp-foo': wrapInFunc({ name: 'foo' }),
    'gulp-bar': wrapInFunc({ name: 'bar' }),
    'bar': wrapInFunc({ name: 'bar' }),
    'gulp-foo-bar': wrapInFunc({ name: 'foo-bar' }),
    'jack-foo': wrapInFunc({ name: 'jack-foo' }),
    'gulp-insert': {
      'append': wrapInFunc({ name: 'insert.append' }),
      'wrap': wrapInFunc({ name: 'insert.wrap' })
    },
    'gulp.baz': wrapInFunc({ name: 'baz' }),
    'findup-sync': function() { return null; },
    '@myco/gulp-test-plugin': wrapInFunc({ name: 'test' })
  });
})();

describe('configuration', function() {
  it('throws a nice error if no configuration is found', function() {
    assert.throws(function() {
      gulpLoadPlugins({
        config: null
      });
    }, /Could not find dependencies. Do you have a package.json file in your project?/);
  });

  it("throws a nice error if there're repeated dependencies pattern in package.json ", function() {
    assert.throws(function() {
      gulpLoadPlugins({
        pattern: [
          '*',
          '!gulp'
        ],
        config: {
          dependencies: {
            'bar': '*',
            'gulp-bar': '~0.0.12'
          }
        }
      });
    }, /Could not define the property "bar", you may have repeated dependencies in your package.json like "gulp-bar" and "bar"/);
  });
});

// Contains common tests with and without lazy mode.
var commonTests = function(lazy) {
  it('loads things in', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: {
        dependencies: {
          'gulp-foo': '1.0.0',
          'gulp-bar': '*',
          'gulp-insert': '*',
          'gulp.baz': '*'
        }
      }
    });

    assert.deepEqual(x.foo(), {
      name: 'foo'
    });
    assert.deepEqual(x.bar(), {
      name: 'bar'
    });
    assert.deepEqual(x.baz(), {
      name: 'baz'
    });
    assert.deepEqual(x.insert.wrap(), {
      name: 'insert.wrap'
    });
    assert.deepEqual(x.insert.append(), {
      name: 'insert.append'
    });
  });

  it('can take a pattern override', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      pattern: 'jack-*',
      replaceString: 'jack-',
      config: {
        dependencies: {
          'jack-foo': '1.0.0',
          'gulp-bar': '*'
        }
      }
    });

    assert.deepEqual(x.foo(), {
      name: 'jack-foo'
    });
    assert(!x.bar);
  });

  it('allows camelizing to be turned off', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      camelize: false,
      config: {
        dependencies: {
          'gulp-foo-bar': '*'
        }
      }
    });

    assert.deepEqual(x['foo-bar'](), {
      name: 'foo-bar'
    });
  });

  it('camelizes plugins name by default', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: {
        dependencies: {
          'gulp-foo-bar': '*'
        }
      }
    });

    assert.deepEqual(x.fooBar(), {
      name: 'foo-bar'
    });
  });

  it('lets something be completely renamed', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: { dependencies: { 'gulp-foo': '1.0.0' } },
      rename: { 'gulp-foo': 'bar' }
    });

    assert.deepEqual(x.bar(), { name: 'foo' });
  });

  it('outputs debug statements', function() {
    var restore = capture(process.stdout);
    try {
      var x = gulpLoadPlugins({
        lazy: lazy,
        DEBUG: true,
        config: { dependencies: { 'gulp-foo': '*' } }
      });

      assert.deepEqual(x.foo(), {
        name: 'foo'
      });
    } catch (err) {
      restore();
      throw err;
    }

    var output = restore('true');
    assert(output.indexOf('gulp-load-plugins') !== -1, 'Expected output to be logged to stdout');
  });

  it('supports loading scopped package', function() {
    var x = gulpLoadPlugins({
      lazy: lazy,
      config: { dependencies: { '@myco/gulp-test-plugin': '1.0.0' } }
    });

    assert.deepEqual(x.myco.testPlugin(), { name: 'test' });
  });

  it('supports custom rename functions', function () {
    var x = gulpLoadPlugins({
      renameFn: function () {
        return 'baz';
      },
      config: {
        dependencies: {
          'gulp-foo-bar': '*'
        }
      }
    });

    assert.throws(function () {
      x.fooBar();
    });

    assert.deepEqual(x.baz(), {
      name: 'foo-bar'
    });
  });
};

describe('no lazy loading', function() {
  commonTests(false);

  var spy;
  before(function() {
    spy = sinon.spy();
    gulpLoadPlugins({
      lazy: false,
      config: {
        dependencies: {
          'gulp-insert': '*'
        }
      },
      requireFn: function() {
        spy();
        return function() {};
      }
    });
  });

  it('does require at first', function() {
    assert(spy.called);
  });
});

describe('with lazy loading', function() {
  commonTests(true);

  var x, spy;
  before(function() {
    spy = sinon.spy();
    x = gulpLoadPlugins({
      lazy: true,
      config: {
        dependencies: {
          'gulp-insert': '*'
        }
      },
      requireFn: function() {
        spy();
        return function() {};
      }
    });
  });

  it('does not require at first', function() {
    assert(!spy.called);
  });

  it('does when the property is accessed', function() {
    x.insert();
    assert(spy.called);
  });
});

describe('common functionality', function () {
  it('throws a sensible error when not found', function () {
    var x = gulpLoadPlugins({ config: path.join(__dirname, '/package.json') });

    assert.throws(function () {
      x.oops();
    }, /Cannot find module 'gulp-oops'/);
  });

  it('allows you to use in a lower directory', function() {
    var plugins = require('../')();
    assert.ok(typeof plugins.test === 'function');
  });
});
