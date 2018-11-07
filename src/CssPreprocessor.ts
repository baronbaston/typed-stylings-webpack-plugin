import * as fs from 'fs'
import { Preprocessor } from './Preprocessor'

export class CssPreprocessor implements Preprocessor {
  private cssRegex = /\.css$/

  test(file: string): boolean {
    return this.cssRegex.test(file)
  }

  readSync(file: string): string {
    return fs.readFileSync(file, 'utf-8')
  }

}
