# gulp-load-plugins

[![npm](https://nodei.co/npm/gulp-load-plugins.svg?downloads=true)](https://nodei.co/npm/gulp-load-plugins/)

> Loads gulp plugins from package dependencies and attaches them to an object of your choice.

[![Build Status](https://travis-ci.org/jackfranklin/gulp-load-plugins.svg?branch=master)](https://travis-ci.org/jackfranklin/gulp-load-plugins)


## Node Version Requirements

Due to the native support of ES2015 syntax in newer versions of Node, this plugin requires at least Node v8. If you need to maintain support for older versions of Node, version 1.6.0 of this plugin is the last release that will support Node versions less than 8.


## Install

NPM:

```sh
$ npm install --save-dev gulp-load-plugins
```

Yarn:

```sh
$ yarn add -D gulp-load-plugins
```


## Usage

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
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const plugins = gulpLoadPlugins();
```

Or, even shorter:

```js
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
```

Will result in the following happening (roughly, plugins are lazy loaded but in practice you won't notice any difference):

```js
plugins.jshint = require('gulp-jshint');
plugins.concat = require('gulp-concat');
```

You can then use the plugins just like you would if you'd manually required them, but referring to them as `plugins.name()`, rather than just `name()`.

This frees you up from having to manually require each gulp plugin.

## Options

You can pass in an object of options that are shown below: (the values for the keys are the defaults):

```js
gulpLoadPlugins({
    DEBUG: false, // when set to true, the plugin will log info to console. Useful for bug reporting and issue debugging
    pattern: ['gulp-*', 'gulp.*', '@*/gulp{-,.}*'], // the glob(s) to search for
    overridePattern: true, // When true, overrides the built-in patterns. Otherwise, extends built-in patterns matcher list.
    config: 'package.json', // where to find the plugins, by default searched up from process.cwd()
    scope: ['dependencies', 'devDependencies', 'peerDependencies'], // which keys in the config to look within
    replaceString: /^gulp(-|\.)/, // what to remove from the name of the module when adding it to the context
    camelize: true, // if true, transforms hyphenated plugins names to camel case
    lazy: true, // whether the plugins should be lazy loaded on demand
    rename: {}, // a mapping of plugins to rename
    renameFn: function (name) { ... }, // a function to handle the renaming of plugins (the default works)
    postRequireTransforms: {}, // see documentation below
    maintainScope: true // toggles loading all npm scopes like non-scoped packages
});
```

## Multiple `config` locations

While it's possile to grab plugins from another location, often times you may want to extend from another package that enables you to keep your own `package.json` free from duplicates, but still add in your own plugins that are needed for your project. Since the `config` option accepts an object, you can merge together multiple locations using the [lodash.merge](https://www.npmjs.com/package/lodash.merge) package:

```js
const merge = require('lodash.merge');

const packages = merge(
  require('dep/package.json'),
  require('./package.json')
);

// Utilities
const $ = gulpLoadPlugins({
  config: packages
});

```

## `postRequireTransforms` (1.3+ only)

This enables you to transform the plugin after it has been required by gulp-load-plugins.

For example, one particular plugin (let's say, `gulp-foo`), might need you to call a function to configure it before it is used. So you would end up with:

```js
const $ = require('gulp-load-plugins')();
$.foo = $.foo.configure(...);
```

This is a bit messy. Instead you can pass a `postRequireTransforms` object which will enable you to do this:

```js
const $ = require('gulp-load-plugins')({
  postRequireTransforms: {
    foo: function(foo) {
      return foo.configure(...);
    }
  }
});

$.foo // is already configured
```

Everytime a plugin is loaded, we check to see if a transform is defined, and if so, we call that function, passing in the loaded plugin. Whatever this function returns is then used as the value that's returned by gulp-load-plugins.

For 99% of gulp-plugins you will not need this behaviour, but for the odd plugin it's a nice way of keeping your code cleaner.


## Renaming

From 0.8.0, you can pass in an object of mappings for renaming plugins. For example, imagine you want to load the `gulp-ruby-sass` plugin, but want to refer to it as just `sass`:

```js
gulpLoadPlugins({
  rename: {
    'gulp-ruby-sass': 'sass'
  }
});
```

Note that if you specify the `renameFn` options with your own custom rename function, while the `rename` option will still work, the `replaceString` and `camelize` options will be ignored.

## npm Scopes

`gulp-load-plugins` comes with [npm scope](https://docs.npmjs.com/misc/scope) support. By default, the scoped plugins are accessible through an object on `plugins` that represents the scope. When `maintainScope = false`, the plugins are available in the top level just like any other non-scoped plugins.

__Note:__ `maintainScope` is only available in Version 1.4.0 and up.

For example, if the plugin is `@myco/gulp-test-plugin` then you can access the plugin as shown in the following example:

```js
const scoped = require('gulp-load-plugins')({
  // true is the default value
  maintainScope: true,
});

scoped.myco.testPlugin();

const nonScoped = require('gulp-load-plugins')({
  maintainScope: false,
});

nonScoped.testPlugin();
```

## Lazy Loading

In 0.4.0 and prior, lazy loading used to only work with plugins that return a function. In newer versions though, lazy loading should work for any plugin. If you have a problem related to this please try disabling lazy loading and see if that fixes it. Feel free to open an issue on this repo too.

## Override Pattern

In 1.4.0 and prior, configuring the `pattern` option would override the built-in `['gulp-*', 'gulp.*', '@*/gulp{-,.}*']`. If `overridePattern: false`, the configured `pattern` will now extends the built-in matching.

For example, both are equivilant statements.
```js
const overridePlugins = require('gulp-load-plugins')({
  // true is the default value
  overridePattern: true,
  pattern: ['gulp-*', 'gulp.*', '@*/gulp{-,.}*', 'foo-bar']
});

const extendedPlugins = require('gulp-load-plugins')({
  overridePattern: false,
  pattern: ['foo-bar']
});
```

## Credit

Credit largely goes to @sindresorhus for his [load-grunt-plugins](https://github.com/sindresorhus/load-grunt-tasks) plugin. This plugin is almost identical, just tweaked slightly to work with Gulp and to expose the required plugins.


## Changelog

##### 2.0.8
- Fixes #141 - module.parent deprecated in Node 14+. Thanks @DaveyJake
- Update dependencies

##### 2.0.7
- Update dependencies

##### 2.0.6
- Update dependencies and add power support for Travis on ppc64le - thanks @dineshks1 - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/140)

##### 2.0.5
- Update dependencies

##### 2.0.4
- Update dependencies

##### 2.0.3
- Update dependencies

##### 2.0.2
- Update dependencies

##### 2.0.1
- Update dependencies and minor JS improvements

##### 2.0.0
- Drop support for old Node. Minimum version now Noda >= 8. Update all dependencies. Refactor some code with ES6. - thanks @TheDancingCode - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/134)

##### 1.6.0
- Bump some dependencies that had security vulnerabilities - thanks @tombye - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/138)

##### 1.5.0
- added `overridePattern` - thanks @bretkikehara - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/127)

##### 1.4.0
- added `maintainScope` - thanks @bretkikehara - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/126)

##### 1.3.0
- added `postRequireTransforms` - thanks @vinitm - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/119)

##### 1.2.4
- Fix bug in 1.2.3 release that stopped logging output in Gulp 3 - thanks @doowb

##### 1.2.3
- Update dependencies in line with Gulp 4 - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/108) - thanks @doowb

##### 1.2.2
- revert the previous PR in 1.2.1 which broke configuration loading for some users

##### 1.2.1
- fix using the wrong `require` function - [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/104) - thanks @mwessner

##### 1.2
- throw an error if two packages are loaded that end up having the same name after the `replaceString` has been removed - thanks @carloshpds

##### 1.1
- added `DEBUG` option to turn on logging and help us debug issues - thanks @dcamilleri


##### 1.0.0
- added `renameFn` function to give users complete control over the name a plugin should be given when loaded - thanks @callumacrae

##### 1.0.0-rc.1
- This is the first release candidate for what will become version 1 of gulp-load-plugins. Once a fix for [#70](https://github.com/jackfranklin/gulp-load-plugins/issues/70) is landed, I plan to release V1.
- **Breaking Change** support for `NODE_PATH` is no longer supported. It was causing complexities and in [the PR that droppped support](https://github.com/jackfranklin/gulp-load-plugins/pull/75) no one shouted that they required `NODE_PATH` support.

##### 0.10.0
- throw a more informative error if a plugin is loaded that gulp-load-plugins can't find. [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/68) - thanks @connor4312
- allow `require` to look on the `NODE_PATH` if it can't find the module in the working directory. [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/69) - thanks @chmanie

##### 0.9.0
- add support for npm-scoped plugins. [PR](https://github.com/jackfranklin/gulp-load-plugins/pull/63) - thanks @hbetts

##### 0.8.1
- fixed a bug where gulp-load-plugins would use the right `package.json` file but the wrong `node_modules` directory - thanks @callumacrae

##### 0.8.0
- add the ability to rename plugins that gulp-load-plugins loads in.

##### 0.7.1
- add `files` property to package.json so only required files are downloaded when installed - thanks @shinnn


##### 0.7.0
- support loading plugins with a dot in the name, such as `gulp.spritesmith` - thanks to @MRuy
- upgrade multimatch to 1.0.0


##### 0.6.0
- Fix issues around plugin picking wrong package.json file - thanks @iliakan (see [issue](https://github.com/jackfranklin/gulp-load-plugins/issues/35)).

##### 0.5.3
- Show a nicer error if the plugin is unable to load any configuration and hence can't find any dependencies to load

##### 0.5.2
- Swap out globule for multimatch, thanks @sindresorhus.

##### 0.5.1
- Updated some internal dependencies which should see some small improvements - thanks @shinnn for this contribution.

##### 0.5.0
- improved lazy loading so it should work with plugins that don't just return a function. Thanks to @nfroidure for help with this.

##### 0.4.0
- plugins are lazy loaded for performance benefit. Thanks @julien-f for this.

##### 0.3.0
- turn the `camelize` option on by default

##### 0.2.0
- added `camelize` option, thanks @kombucha.
- renamed to `gulp-load-plugins`.

##### 0.1.1
- add link to this repository into `package.json` (thanks @ben-eb).

##### 0.1.0
- move to `gulpLoadplugins` returning an object with the tasks define.

##### 0.0.5
- added `replaceString` option to configure exactly what gets replace when the plugin adds the module to the context

##### 0.0.4
- fixed keyword typo so plugin appears in search for gulp plugins

##### 0.0.3
- removed accidental console.log I'd left in

##### 0.0.2
- fixed accidentally missing a dependency out of package.json

##### 0.0.1
- initial release
