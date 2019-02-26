import { Preprocessor } from './Preprocessor';
export declare class SassPreprocessor implements Preprocessor {
    private nodeModulesPath;
    private sassRegex;
    private sassTypingRegex;
    private paths;
    constructor(paths: string[], nodeModulesPath: string);
    test(file: string): boolean;
    testTyping(file: string): boolean;
    readSync(file: string): string;
    private resolvePath;
    static isSupported(): boolean;
}
