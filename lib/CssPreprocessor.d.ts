import { Preprocessor } from './Preprocessor';
export declare class CssPreprocessor implements Preprocessor {
    private cssRegex;
    test(file: string): boolean;
    readSync(file: string): string;
}
