import { TypedStylingsWebpackPlugin } from './TypedStylingsWebpackPlugin'

export class ForkTsCheckerTypedStylingsWebpackPlugin {
  private typedStylingsWebpackPlugin: TypedStylingsWebpackPlugin

  constructor(options: any) {
    this.typedStylingsWebpackPlugin = new TypedStylingsWebpackPlugin({
      ...options,
      asyncHook: 'forkTsCheckerServiceBeforeStart'
    })
  }

  apply(compiler: any) {
    this.typedStylingsWebpackPlugin.apply(compiler)
  }
}
