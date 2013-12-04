#gulp-load-tasks

Loads in any gulp plugins and attaches them to the global scope.

## Usage

```
$ npm install --save-dev gulp-load-tasks
```

Given a `package.json` file that has some dependencies within:

```json
"dependencies": {
    "gulp-jshint": "*",
    "gulp-concat": "*"
}
```

Adding this into your `Gulpfile.js`:

```js
var gulp = require("gulp");
var gulpLoadTasks = require("gulp-load-tasks");

gulpLoadTasks(this);
```

You could even shorten that further:

```js
require("gulp-load-tasks")(this)
```

Will result in the following happening:

```js
this.jshint = require("gulp-jshint");
this.concat = require("gulp-concat");
```

This frees you up from having to manually require each gulp plugin.

## Options

You can pass in a second argument, an object of options:

```js
gulpLoadTasks(this, {
    pattern: "gulp-*", // the glob to search for
    config: "package.json", // where to find the plugins
    scope: ["dependencies", "devDependencies", "peerDependencies"] // which keys in the config to look within
});
```

## Credit

Credit largely goes to @sindresorhus for his [load-grunt-tasks](https://github.com/sindresorhus/load-grunt-tasks) plugin. This plugin is almost identical, just tweaked slightly to work with Gulp and to expose the required plugins.

## Changelog

#####0.0.4
- fixed keyword typo so plugin appears in search for gulp plugins

#####0.0.3
- removed accidental console.log I'd left in

#####0.0.2
- fixed accidentally missing a dependency out of package.json

#####0.0.1
- initial release



