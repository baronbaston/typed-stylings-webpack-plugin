export declare class SassPreprocessor {
    private paths;
    private nodeModulesPath;
    private _sassRegex;
    constructor(paths: string[], nodeModulesPath: string);
    test(file: string): boolean;
    readSync(file: string): string;
    _resolvePath(includeUrl: string, fileUrl: string): string;
}
export declare class CssPreprocessor {
    private cssRegex;
    test(file: string): boolean;
    readSync(file: string): string;
}
export interface Options {
    asyncHook: string;
    includePaths: string | string[];
    nodeModulesPath?: string;
    preProcessors: any[];
    dtsOptions: object;
}
export declare class TypedStylingsWebpackPlugin {
    private _asyncHook;
    private _includePaths;
    private _nodeModulesPath;
    private _preProcessors;
    private _dtsOptions;
    private _dtsCreator;
    private _timestampCache;
    constructor(options: Options);
    apply(compiler: any): void;
    _getModifiedFiles(dir: string): string[];
    _walkSync(dir: string, result?: Array<{
        path: string;
        stat: number;
    }>): Array<{
        path: string;
        stat: number;
    }>;
    _getFileContentAsCss(file: string): any;
}
export declare class ForkTsCheckerTypedStylingsWebpackPlugin {
    private typedStylingsWebpackPlugin;
    constructor(options: any);
    apply(compiler: any): void;
}
