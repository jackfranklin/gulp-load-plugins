'use strict';
const hasGulplog = require('has-gulplog');
const micromatch = require('micromatch');
const unique = require('array-unique');
const findup = require('findup-sync');
const resolve = require('resolve');
const path = require('path');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

function camelize(str) {
  return str.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
}

// code from https://github.com/gulpjs/gulp-util/blob/master/lib/log.js
// to use the same functionality as gulp-util for backwards compatibility
// with gulp 3x cli
function logger() {
  if (hasGulplog()) {
    // specifically deferring loading here to keep from registering it globally
    const gulplog = require('gulplog');
    gulplog.info.apply(gulplog, arguments);
  } else {
    // specifically deferring loading because it might not be used
    const fancylog = require('fancy-log');
    fancylog.apply(null, arguments);
  }
}

function getPattern(options) {
  const defaultPatterns = ['gulp-*', 'gulp.*', '@*/gulp{-,.}*'];
  const overridePattern = 'overridePattern' in options ? !!options.overridePattern : true;
  if (overridePattern) {
    return arrayify(options.pattern || defaultPatterns);
  }
  return defaultPatterns.concat(arrayify(options.pattern));
}

module.exports = function(options) {
  const finalObject = {};
  let requireFn;
  options = options || {};

  const DEBUG = options.DEBUG || false;
  const pattern = getPattern(options);
  const config = options.config || findup('package.json', { cwd: path.dirname(module.parent.filename) });
  const scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);
  const replaceString = options.replaceString || /^gulp(-|\.)/;
  const camelizePluginName = options.camelize !== false;
  const lazy = 'lazy' in options ? !!options.lazy : true;
  const renameObj = options.rename || {};
  const maintainScope = 'maintainScope' in options ? !!options.maintainScope : true;

  logDebug(`Debug enabled with options: ${JSON.stringify(options)}`);

  const renameFn = options.renameFn || function(name) {
    name = name.replace(replaceString, '');
    return camelizePluginName ? camelize(name) : name;
  };

  const postRequireTransforms = options.postRequireTransforms || {};

  if (typeof options.requireFn === 'function') {
    requireFn = options.requireFn;
  } else if (typeof config === 'string') {
    requireFn = function(name) {
      // This searches up from the specified package.json file, making sure
      // the config option behaves as expected. See issue #56.
      const src = resolve.sync(name, { basedir: path.dirname(config) });
      return require(src);
    };
  } else {
    requireFn = require;
  }

  const configObject = (typeof config === 'string') ? require(config) : config;

  if (!configObject) {
    throw new Error('Could not find dependencies. Do you have a package.json file in your project?');
  }

  const names = scope.reduce((result, prop) => result.concat(Object.keys(configObject[prop] || {})), []);

  logDebug(`${names.length} plugin(s) found: ${names.join(' ')}`);

  pattern.push('!gulp-load-plugins');

  function logDebug(message) {
    if (DEBUG) {
      logger(`gulp-load-plugins: ${message}`);
    }
  }

  function defineProperty(object, transform, requireName, name, maintainScope) {
    let err;
    if (object[requireName]) {
      logDebug(`error: defineProperty ${name}`);
      err = maintainScope
        ? `Could not define the property "${requireName}", you may have repeated dependencies in your package.json like` + ` "gulp-${requireName}" and ` + `"${requireName}"`
        : `Could not define the property "${requireName}", you may have repeated a dependency in another scope like` + ` "gulp-${requireName}" and ` + `"@foo/gulp-${requireName}"`;
      throw new Error(err);
    }

    if (lazy) {
      logDebug(`lazyload: adding property ${requireName}`);
      Object.defineProperty(object, requireName, {
        enumerable: true,
        get: function() {
          logDebug(`lazyload: requiring ${name}...`);
          return transform(requireName, requireFn(name));
        }
      });
    } else {
      logDebug(`requiring ${name}...`);
      object[requireName] = transform(requireName, requireFn(name));
    }
  }

  function getRequireName(name) {
    let requireName;

    if (renameObj[name]) {
      requireName = options.rename[name];
    } else {
      requireName = renameFn(name);
    }

    logDebug(`renaming ${name} to ${requireName}`);

    return requireName;
  }

  function applyTransform(requireName, plugin) {
    const transform = postRequireTransforms[requireName];

    if (transform && typeof transform === 'function') { // if postRequireTransform function is passed, pass it the plugin and return it
      logDebug(`transforming ${requireName}`);
      return transform(plugin);
    } else {
      return plugin; // if no postRequireTransform function passed, return the plugin as is
    }
  }

  const scopeTest = /^@/;
  const scopeDecomposition = /^@(.+)\/(.+)/;

  unique(micromatch(names, pattern)).forEach((name) => {
    let decomposition;
    let fObject = finalObject;
    if (scopeTest.test(name)) {
      decomposition = scopeDecomposition.exec(name);
      if (maintainScope) {
        if (!Object.prototype.hasOwnProperty.call(fObject, decomposition[1])) {
          finalObject[decomposition[1]] = {};
        }
        fObject = finalObject[decomposition[1]];
      }

      defineProperty(fObject, applyTransform, getRequireName(decomposition[2]), name, maintainScope);
    } else {
      defineProperty(fObject, applyTransform, getRequireName(name), name, maintainScope);
    }
  });

  return finalObject;
};

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
