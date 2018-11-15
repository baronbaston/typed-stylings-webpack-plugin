/// <reference types="node-sass" />
import * as path from 'path'
import { Preprocessor } from './Preprocessor'

const renderSync = (() => {
  try {
    return require('node-sass').renderSync as typeof import('node-sass').renderSync
  }
  catch {
    return null
  }
})()

export class SassPreprocessor implements Preprocessor {
  private _sassRegex = /\.(?:scss|sass)$/

  private paths: string[];

  constructor(paths: string[], private nodeModulesPath: string) {
    this.paths = paths.concat();
  }

  test(file: string): boolean {
    return this._sassRegex.test(file)
  }

  readSync(file: string): string {
    const renderedContent = renderSync!({
    file: file,
    includePaths: this.paths,
    indentedSyntax: true,
    importer: [(includeUrl: string, fileUrl: string): { file: string } => {
      const path = this.resolvePath(includeUrl, fileUrl)
      this.paths.push(fileUrl)
      return {file: path}
    }]})
    return renderedContent.css.toString('utf-8')
  }

  private resolvePath(includeUrl: string, fileUrl: string): string {
    if (includeUrl.charAt(0) === '~') {
    return path.join(this.nodeModulesPath, includeUrl.substring(1, includeUrl.length))
    }
    return path.resolve(path.join(path.dirname(fileUrl), includeUrl))
  }

  static isSupported() {
    return renderSync !== null
  }

}
