/// <reference types="node-sass" />

import * as fs from 'fs'
import * as path from 'path'
import DtsCreator from 'typed-css-modules'

const renderSync = (() => {
  try {
    return require('node-sass').renderSync as typeof import('node-sass').renderSync
  }
  catch {
    return null
  }
})()

export class SassPreprocessor {
  private _sassRegex = /\.(?:scss|sass)$/

  constructor (private paths: string[], private nodeModulesPath: string) {
  }

  test (file: string) {
    return this._sassRegex.test(file)
  }

  readSync (file: string) {
    const renderedContent = renderSync!({
      file: file,
      includePaths: this.paths,
      indentedSyntax: true,
      importer: [(includeUrl: string, fileUrl: string): { file: string } => {
        const path = this._resolvePath(includeUrl, fileUrl);
        this.paths.push(fileUrl);
        return {file: path};
      }]
    });
    return renderedContent.css.toString('utf-8');
  }

  _resolvePath (includeUrl: string, fileUrl: string): string {
    if (includeUrl.charAt(0) === '~') {
      return path.join(this.nodeModulesPath, includeUrl.substring(1, includeUrl.length));
    }
    return path.resolve(path.join(path.dirname(fileUrl), includeUrl));
  }

}

export class CssPreprocessor {
  private cssRegex = /\.css$/

  test (file: string): boolean {
    return this.cssRegex.test(file)
  }

  readSync (file: string): string {
    return fs.readFileSync(file, 'utf-8');
  }

}

export interface Options {
  asyncHook: string
  includePaths: string | string[]
  nodeModulesPath?: string
  preProcessors: any[]
  dtsOptions: object
}

export class TypedStylingsWebpackPlugin {
  private _asyncHook: string
  private _includePaths: string[]
  private _nodeModulesPath: string
  private _preProcessors: any[]
  private _dtsOptions: any
  private _dtsCreator: any
  private _timestampCache: { [key: string]: number }

  constructor(options: Options) {
    this._asyncHook = options.asyncHook;
    this._includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths];
    this._nodeModulesPath = options.nodeModulesPath || 'node_modules';
    this._preProcessors = options.preProcessors
      ? options.preProcessors
      : [
          ...(renderSync ? [new SassPreprocessor(this._includePaths, this._nodeModulesPath)] : []),
          new CssPreprocessor
      ];
    this._dtsOptions = options.dtsOptions || {camelCase: true};
    this._dtsCreator = new DtsCreator(this._dtsOptions);
    this._timestampCache = {};
  }

  apply (compiler: any) {
    compiler.hooks[this._asyncHook].tapPromise('TypedStylingsWebpackPlugin', () => {
      const results = this._includePaths
        .reduce((result, path) => result.concat(this._getModifiedFiles(path)), [] as string[])
        .map(path => ({path, css: this._getFileContentAsCss(path)}))
        .filter(pathAndCss => pathAndCss.css)
        .map(pathAndCss =>
          this._dtsCreator.create(pathAndCss.path, pathAndCss.css).then((content: any) => content.writeFile())
        )
      return Promise.all(results);
    });
  }

  _getModifiedFiles (dir: string): string[] {
    const files = this._walkSync(dir);
    return files
      .filter(file => {
        const isModified = !this._timestampCache[file.path] || this._timestampCache[file.path] < file.stat;
        this._timestampCache[file.path] = file.stat;
        return isModified;
      })
      .map(file => file.path);
  }

  _walkSync (dir: string, result: Array<{ path: string, stat: number }> = []): Array<{ path: string, stat: number }> {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const pathToFile = path.join(dir, file);
      const stat = fs.statSync(pathToFile);
      if (stat.isDirectory()) {
          this._walkSync(pathToFile, result);
      } else {
          result.push({ path: pathToFile, stat: stat.mtimeMs });
      }
    }
    return result;
  }

  _getFileContentAsCss (file: string) {
    const preProcessor = this._preProcessors.find(preProcessor => preProcessor.test(file));
    return preProcessor ? preProcessor.readSync(file) : null;
  }

}

export class ForkTsCheckerTypedStylingsWebpackPlugin {
  private typedStylingsWebpackPlugin: TypedStylingsWebpackPlugin

  constructor (options: any) {
    this.typedStylingsWebpackPlugin = new TypedStylingsWebpackPlugin({
      ...options,
      asyncHook: 'forkTsCheckerServiceBeforeStart'
    });
  }

  apply (compiler: any) {
    this.typedStylingsWebpackPlugin.apply(compiler);
  }
}
