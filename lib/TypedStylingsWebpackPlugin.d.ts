import { Preprocessor } from './Preprocessor';
export interface Options {
    asyncHook: string;
    includePaths: string | string[];
    nodeModulesPath?: string;
    preProcessors: Preprocessor[];
    dtsOptions: object;
}
export declare class TypedStylingsWebpackPlugin {
    private asyncHook;
    private includePaths;
    private nodeModulesPath;
    private preProcessors;
    private dtsOptions;
    private dtsCreator;
    private timestampCache;
    constructor(options: Options);
    apply(compiler: any): void;
    private getModifiedFiles;
    private walkSync;
    private getFileContentAsCss;
}
