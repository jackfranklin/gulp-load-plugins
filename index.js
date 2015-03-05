'use strict';
var multimatch = require('multimatch');
var findup = require('findup-sync');
var path = require('path');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

function camelize(str) {
  return str.replace(/-(\w)/g, function(m, p1) {
    return p1.toUpperCase();
  });
}

module.exports = function(options) {
  console.log('i have been run');
  var finalObject = {};
  var configObject;
  var requireFn;
  options = options || {};

  var pattern = arrayify(options.pattern || ['gulp-*', 'gulp.*', '@*/gulp{.,-}*']);
  var config = options.config || findup('package.json', {cwd: parentDir});
  var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);
  var replaceString = options.replaceString || /^gulp(-|\.)/;
  var camelizePluginName = options.camelize === false ? false : true;
  var lazy = 'lazy' in options ? !!options.lazy : true;
  var renameObj = options.rename || {};

  if(typeof options.requireFn === 'function') {
    requireFn = options.requireFn;
  } else if(typeof config === 'string') {
    requireFn = function (name) {
      // This searches up from the specified package.json file, making sure
      // the config option behaves as expected. See issue #56.
      var searchFor = path.join('node_modules', name);
      return require(findup(searchFor, {cwd: path.dirname(config)}));
    };
  } else {
    requireFn = require;
  }

  configObject = (typeof config === 'string') ? require(config) : config;

  if(!configObject) {
    throw new Error('Could not find dependencies. Do you have a package.json file in your project?');
  }

  var names = scope.reduce(function(result, prop) {
    return result.concat(Object.keys(configObject[prop] || {}));
  }, []);

  pattern.push('!gulp-load-plugins');

  function defineProperty(object, requireName, name) {
    if(lazy) {
      Object.defineProperty(object, requireName, {
        get: function() {
          return requireFn(name);
        }
      });
    } else {
      finalObject[requireName] = requireFn(name);
    }
  }

  function getRequireName(name) {
    var requireName;

    if(renameObj[name]) {
      requireName = options.rename[name];
    } else {
      var moduleName = name.split('/')[1];
      requireName = name.replace(replaceString, '');
      requireName = camelizePluginName ? camelize(requireName) : requireName;
    }

    return requireName;
  }

  multimatch(names, pattern).forEach(function(name) {
    var requireName, match;

    if(match = name.match(/@(.+)\/gulp/i)) {
      console.log('is a scoped plugin', name);
      var scope = match[1];
      finalObject[scope] = finalObject[scope] || {};
      requireName = getRequireName(name.split('/')[1]);

      defineProperty(finalObject[scope], requireName, name);
    } else {
      console.log('is not a scoped plugin', name);
      requireName = getRequireName(name);

      defineProperty(finalObject, requireName, name);
    }
  });

  return finalObject;
};

var parentDir = path.dirname(module.parent.filename);

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
