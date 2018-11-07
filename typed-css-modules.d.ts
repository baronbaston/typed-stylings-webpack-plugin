declare module 'typed-css-modules' {
  class DtsCreator {
    constructor (options: object)
    create(path: string, css: string): Promise<{ writeFile: () => void }>
  }
  export = DtsCreator
}
