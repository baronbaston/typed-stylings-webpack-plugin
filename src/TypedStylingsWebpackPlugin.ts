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
  exclude?: RegExp
  preProcessors: Preprocessor[]
  dtsOptions: object
  cleanup: boolean
}

export class TypedStylingsWebpackPlugin {
  private asyncHook: string
  private includePaths: string[]
  private nodeModulesPath: string
  private exclude: RegExp | undefined
  private preProcessors: Preprocessor[]
  private dtsOptions: object
  private dtsCreator: DtsCreator
  private timestampCache: { [key: string]: number }
  private cleanup: boolean

  constructor(options: Options) {
    this.asyncHook = options.asyncHook
    this.includePaths = Array.isArray(options.includePaths) ? options.includePaths : [options.includePaths]
    this.nodeModulesPath = options.nodeModulesPath || 'node_modules'
    this.exclude = options.exclude
    this.preProcessors = options.preProcessors
      ? options.preProcessors
      : [
          ...(SassPreprocessor.isSupported() ? [new SassPreprocessor(this.includePaths, this.nodeModulesPath)] : []),
          new CssPreprocessor()
      ]
    this.dtsOptions = options.dtsOptions || {camelCase: true}
    this.dtsCreator = new DtsCreator(this.dtsOptions)
    this.timestampCache = {}
    this.cleanup = options.cleanup === true
  }

  apply(compiler: any) {
    if (this.cleanup) {
      this.cleanupTypings();
    }
    compiler.hooks[this.asyncHook].tapPromise('TypedStylingsWebpackPlugin', () => {
      const results = this.includePaths
        .reduce((result, path) => result.concat(this.getModifiedFiles(path)), [] as string[])
        .map(path => ({path, css: this.getFileContentAsCss(path)}))
        .filter(pathAndCss => {
          if (this.exclude) {
            return !this.exclude.test(pathAndCss.path) && pathAndCss.css
          }
          return pathAndCss.css
        })
        .map(pathAndCss =>
          this.dtsCreator.create(pathAndCss.path, pathAndCss.css!).then((content: any) => content.writeFile())
        )
      return Promise.all(results)
    })
  }

  private cleanupTypings() {
    const sliceLength = '.d.ts'.length;
    this.includePaths
      .map(dir => this.walkSync(dir))
      .reduce((result, dirFiles) => result.concat(dirFiles), [])
      .filter(file => this.preProcessors.some(preProcessor => preProcessor.testTyping(file.path) && !fs.existsSync(file.path.slice(0, file.path.length - sliceLength))))
      .forEach(file => {
        fs.unlinkSync(`${file.path}`)
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
