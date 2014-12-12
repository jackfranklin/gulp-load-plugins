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
  var finalObject = {};
  options = options || {};

  var camelizePluginName = options.camelize === false ? false : true;
  var config = options.config || findup('package.json', {cwd: parentDir});
  var lazy = 'lazy' in options ? !!options.lazy : true;
  var pattern = arrayify(options.pattern || ['gulp-*', 'gulp.*']);
  var renameObj = options.rename || {};
  var replaceString = options.replaceString || /^gulp(-|\.)/;
  var requireFn = options.requireFn || require;
  var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);

  if (typeof config === 'string') {
    config = require(config);
  }

  if(!config) {
    throw new Error('Could not find dependencies. Do you have a package.json file in your project?');
  }

  var names = scope.reduce(function(result, prop) {
    return result.concat(Object.keys(config[prop] || {}));
  }, []);

  pattern.push('!gulp-load-plugins');

  var loadedPluginsList = [];

  multimatch(names, pattern).forEach(function(name) {
    var requireName;

    if(renameObj[name]) {
      requireName = options.rename[name];
    } else {
      requireName = name.replace(replaceString, '');
      requireName = camelizePluginName ? camelize(requireName) : requireName;
    }

    loadedPluginsList.push(requireName);

    if(lazy) {
      Object.defineProperty(finalObject, requireName, {
        get: function() {
          return requireFn(name);
        }
      });
    } else {
      finalObject[requireName] = requireFn(name);
    }
  });

  finalObject.loadedPlugins = function() {
    return loadedPluginsList;
  };

  return finalObject;
};

var parentDir = path.dirname(module.parent.filename);

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
