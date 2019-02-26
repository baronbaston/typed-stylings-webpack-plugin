import { Preprocessor } from './Preprocessor';
export declare class CssPreprocessor implements Preprocessor {
    private cssRegex;
    private cssTypingRegex;
    test(file: string): boolean;
    testTyping(file: string): boolean;
    readSync(file: string): string;
}
