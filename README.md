# typed-stylings-webpack-plugin

Creates TypeScript definitions for style files using [typed-css-modules](https://github.com/Quramy/typed-css-modules). Per default creates defintions for .css, .scss and .sass (scss/sass if node-sass is installed).

The goal of the plugin is to generate TypeScript defintions before type checking is done by any other webpack plugin/loader.

## Configure with ForkTsCheckerWebpackPlugin

If you are using ForkTsCheckerWebpackPlugin you can configure the below in your webpack config:

```
plugins: [
  ...
  new ForkTsCheckerTypedStylingsWebpackPlugin({
    includePaths: ['src']
  }),
  ...
]
```

This plugin will tap the fork-ts-checker hook `forkTsCheckerServiceBeforeStart` and delay type checking until all defintions files have been created.

## Configure with other hook

If you want to run this plugin on, for example, the beforeCompile hook then the below configuration can be used:

```
plugins: [
  ...
  new TypedStylingsWebpackPlugin({
    includePaths: ['src'],
    asyncHook: 'beforeCompile'
  }),
  ...
]
```

## Options

- **includePaths** `string|string[]`:
  Which directories to look for styling files.
- **asyncHook** `string`
  Which webpack plugin async hook to hook into.
- **nodeModulesPath** `string`
  Path to node_modules. Needed if styling file have been included from node_modules.
- **preProcessors** `object[]`
  Array of preprocessor instances. By default `SassPreprocessor` and `CssPreprocessor` are included. See _Preprocessors_ for more info.
- **dtsOptions** `object`:
  See [typed-css-modules](https://github.com/Quramy/typed-css-modules)
- **cleanup** `boolean`:
  If true any .scss.d.ts included in _includePaths_ will be removed when plugin is executed the first time.

## Preprocessor

Example

```
const fs = require('fs);

class ReadFilePreprocessor {
  test(file) {
    return true;
  }

  readSync(file) {
    return fs.readFileSync(file);
  }
}
```
