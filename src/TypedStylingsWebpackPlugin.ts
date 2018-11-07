import * as fs from 'fs'
import * as path from 'path'
import DtsCreator from 'typed-css-modules'
import { CssPreprocessor } from './CssPreprocessor'
import { SassPreprocessor } from './SassPreprocessor'
import { Preprocessor } from './Preprocessor'

export interface Options {
  asyncHook: string
  includePaths: string | string[]
  nodeModulesPath?: string
  preProcessors: Preprocessor[]
  dtsOptions: object
}

export class TypedStylingsWebpackPlugin {
  private asyncHook: string
  private includePaths: string[]
  private nodeModulesPath: string
  private preProcessors: Preprocessor[]
  private dtsOptions: object
  private dtsCreator: DtsCreator
  private timestampCache: { [key: string]: number }

  constructor(options: Options) {
    this.asyncHook = options.asyncHook
    this.includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths]
    this.nodeModulesPath = options.nodeModulesPath || 'node_modules'
    this.preProcessors = options.preProcessors
      ? options.preProcessors
      : [
          ...(SassPreprocessor.isSupported() ? [new SassPreprocessor(this.includePaths, this.nodeModulesPath)] : []),
          new CssPreprocessor()
      ]
    this.dtsOptions = options.dtsOptions || {camelCase: true}
    this.dtsCreator = new DtsCreator(this.dtsOptions)
    this.timestampCache = {}
  }

  apply(compiler: any) {
    compiler.hooks[this.asyncHook].tapPromise('TypedStylingsWebpackPlugin', () => {
      const results = this.includePaths
        .reduce((result, path) => result.concat(this.getModifiedFiles(path)), [] as string[])
        .map(path => ({path, css: this.getFileContentAsCss(path)}))
        .filter(pathAndCss => pathAndCss.css)
        .map(pathAndCss =>
          this.dtsCreator.create(pathAndCss.path, pathAndCss.css!!).then((content: any) => content.writeFile())
        )
      return Promise.all(results)
    })
  }

  private getModifiedFiles(dir: string): string[] {
    const files = this.walkSync(dir)
    return files
      .filter(file => {
        const isModified = !this.timestampCache[file.path] || this.timestampCache[file.path] < file.stat
        this.timestampCache[file.path] = file.stat
        return isModified
      })
      .map(file => file.path)
  }

  private walkSync(dir: string, result: Array<{ path: string, stat: number }> = []): Array<{ path: string, stat: number }> {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const pathToFile = path.join(dir, file)
      const stat = fs.statSync(pathToFile)
      if (stat.isDirectory()) {
          this.walkSync(pathToFile, result)
      } else {
          result.push({ path: pathToFile, stat: stat.mtimeMs })
      }
    }
    return result
  }

  private getFileContentAsCss(file: string) {
    const preProcessor = this.preProcessors.find(preProcessor => preProcessor.test(file))
    return preProcessor ? preProcessor.readSync(file) : null
  }

}
