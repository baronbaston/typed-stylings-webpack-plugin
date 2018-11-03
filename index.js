const fs = require('fs');
const path = require('path');
const DtsCreator = require('typed-css-modules');
const sass = (() => {
  try {
    return require('node-sass');
  } catch (e) {}
})();

class SassPreprocessor {

  constructor(paths, nodeModulesPath) {
    this._sassRegex = /\.(scss|sass)$/;
    this._includePaths = paths;
    this._nodeModulesPath = nodeModulesPath;
  }

  test(file) {
    return this._sassRegex.test(file)
  }

  readSync(file) {
    const renderedContent = sass.renderSync({
      file: file,
      includePaths: this._includePaths,
      indentedSyntax: true,
      importer: [(includeUrl, fileUrl) => {
        const path = this._resolvePath(includeUrl, fileUrl);
        this._includePaths.push(fileUrl);
        return {file: path};
      }]
    });
    return renderedContent.css.toString('utf-8');
  }

  _resolvePath(includeUrl, fileUrl) {
    let resolvedPath;

    if (includeUrl.charAt(0) === '~') {
      resolvedPath = path.join(this._nodeModulesPath, includeUrl.substring(1, includeUrl.length));
    } else {
      resolvedPath = path.resolve(path.join(path.dirname(fileUrl), includeUrl));
    }

    return resolvedPath;
  }

}

class CssPreprocessor {

  constructor() {
    this._cssRegex = /\.css$/;
  }

  test(file) {
    return this._cssRegex.test(file)
  }

  readSync(file) {
    return fs.readFileSync(file, 'utf-8');
  }

}

class TypedStylingsWebpackPlugin {

  constructor(options) {
    this._asyncHook = options.asyncHook;
    this._includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths];
    this._nodeModulesPath = options.nodeModulesPath || 'node_modules';
    this._preProcessors = options.preProcessors
      ? options.preProcessors
      : [
          ...(sass ? [new SassPreprocessor(this._includePaths, this._nodeModulesPath)] : []),
          new CssPreprocessor
      ];
    this._dtsOptions = options.dtsOptions || {camelCase: true};
    this._dtsCreator = new DtsCreator(this._dtsOptions);
    this._timestampCache = {};
  }

  apply(compiler) {
    compiler.hooks[this._asyncHook].tapPromise('TypedStylingsWebpackPlugin', () => {
      const results = this._includePaths
        .reduce((result, path) => result.concat(this._getModifiedFiles(path)), [])
        .map(path => ({path, css: this._getFileContentAsCss(path)}))
        .filter(pathAndCss => pathAndCss.css)
        .map(pathAndCss =>
          this._dtsCreator.create(pathAndCss.path, pathAndCss.css).then(content => content.writeFile())
        )
      return Promise.all(results);
    });
  }

  _getModifiedFiles(dir) {
    const files = this._walkSync(dir);
    return files
      .filter(file => {
        const isModified = !this._timestampCache[file.path] || this._timestampCache[file.path] < file.stat.mtimeMs;
        this._timestampCache[file.path] = file.stat.mtimeMs;
        return isModified;
      })
      .map(file => file.path);
  }

  _walkSync(dir, result=[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const pathToFile = path.join(dir, file);
      const stat = fs.statSync(pathToFile);
      if (stat.isDirectory()) {
          this._walkSync(pathToFile, result);
      } else {
          result.push({path: pathToFile, stat: stat});
      }
    }
    return result;
  }

  _getFileContentAsCss(file) {
    const preProcessor = this._preProcessors.find(preProcessor => preProcessor.test(file));
    return preProcessor ? preProcessor.readSync(file) : null;
  }

}

class ForkTsCheckerTypedStylingsWebpackPlugin {

  constructor(options) {
    delete options.asyncHook;
    options.asyncHook = 'forkTsCheckerServiceBeforeStart';
    this.typedStylingsWebpackPlugin = new TypedStylingsWebpackPlugin(options);
  }

  apply(compiler) {
    this.typedStylingsWebpackPlugin.apply(compiler);
  }

}

module.exports = {
  SassPreprocessor: SassPreprocessor,
  CssPreprocessor: CssPreprocessor,
  TypedStylingsWebpackPlugin: TypedStylingsWebpackPlugin,
  ForkTsCheckerTypedStylingsWebpackPlugin: ForkTsCheckerTypedStylingsWebpackPlugin
}
