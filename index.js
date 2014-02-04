var globule = require('globule');
var findup = require('findup-sync');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
};

function camelize(str) {
  return str.replace(/-(\w)/g, function(m, p1) {
    return p1.toUpperCase();
  })
};

module.exports = function(options) {
  var finalObject = {};
  options = options || {};

  var pattern = arrayify(options.pattern || ['gulp-*']);
  var config = options.config || findup('package.json');
  var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);
  var replaceString = options.replaceString || "gulp-";
  var camelizePluginName = options.camelize === false ? false : true;

  if (typeof config === 'string') {
    config = require(config);
  }

  var names = scope.reduce(function (result, prop) {
    return result.concat(Object.keys(config[prop] || {}));
  }, []);

  pattern.push("!gulp-load-plugins");

  globule.match(pattern, names).forEach(function(name) {
    var requireName = name.replace(replaceString, "");
    requireName = camelizePluginName ? camelize(requireName) : requireName;
    finalObject[requireName] = require(name);
  });

  return finalObject;

};
