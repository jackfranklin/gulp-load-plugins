var findup = require('findup-sync');
var path = require('path');
var parentDir = path.dirname(module.parent.filename);

module.exports = require('./')({
  config: findup('package.json', {cwd: parentDir})
});

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
