var globule = require('globule');
var findup = require('findup-sync');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

module.exports = function(context, options) {
  options = options || {};

  var pattern = arrayify(options.pattern || ['gulp-*']);
  var config = options.config || findup('package.json');
  var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);

  if (typeof config === 'string') {
    config = require(config);
  }

  var names = scope.reduce(function (result, prop) {
    return result.concat(Object.keys(config[prop] || {}));
  }, []);

  pattern.push("!gulp-load-tasks");
  console.log(globule.match(pattern, names));

  globule.match(pattern, names).forEach(function(name) {
    var requireName = name.replace("gulp-", "");
    context[requireName] = require(name);
  });

};
