export interface Preprocessor {
	test(file: string): boolean
	testTyping(file: string): boolean
	readSync(file: string): string
}
