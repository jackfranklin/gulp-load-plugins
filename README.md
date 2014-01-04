#gulp-load-tasks

Loads in any gulp plugins and attaches them to the global scope, or an object of your choice.

[![Build Status](https://travis-ci.org/jackfranklin/gulp-load-tasks.png)](https://travis-ci.org/jackfranklin/gulp-load-tasks)

## Usage

```
$ npm install --save-dev gulp-load-tasks
```

Given a `package.json` file that has some dependencies within:

```json
{
    "dependencies": {
        "gulp-jshint": "*",
        "gulp-concat": "*"
    }
}
```

Adding this into your `Gulpfile.js`:

```js
var gulp = require("gulp");
var gulpLoadTasks = require("gulp-load-tasks");
var tasks = gulpLoadTasks();
```

Or, even shorter:

```js
var tasks = require("gulp-load-tasks")();
```

Will result in the following happening:

```js
tasks.jshint = require("gulp-jshint");
tasks.concat = require("gulp-concat");
```

You can then use the plugins just like you would if you'd manually required them, but referring to them as `tasks.name()`, rather than just `name()`.

This frees you up from having to manually require each gulp plugin.

## Options

You can pass in an argument, an object of options (the shown options are the defaults):

```js
gulpLoadTasks({
    pattern: "gulp-*", // the glob to search for
    config: "package.json", // where to find the plugins
    scope: ["dependencies", "devDependencies", "peerDependencies"], // which keys in the config to look within
    replaceString: "gulp-" // what to remove from the name of the module when adding it to the context
});
```

## Credit

Credit largely goes to @sindresorhus for his [load-grunt-tasks](https://github.com/sindresorhus/load-grunt-tasks) plugin. This plugin is almost identical, just tweaked slightly to work with Gulp and to expose the required plugins.

## Changelog

#####0.1.1
- add link to this repository into `package.json` (thanks @ben-eb).

#####0.1.0
- move to `gulpLoadTasks` returning an object with the tasks define.

#####0.0.5
- added `replaceString` option to configure exactly what gets replace when the plugin adds the module to the context

#####0.0.4
- fixed keyword typo so plugin appears in search for gulp plugins

#####0.0.3
- removed accidental console.log I'd left in

#####0.0.2
- fixed accidentally missing a dependency out of package.json

#####0.0.1
- initial release



