export interface Preprocessor {
    test(file: string): boolean;
    readSync(file: string): string;
}
