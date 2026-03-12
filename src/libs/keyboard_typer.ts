// npm imports
import Robotjs from "robotjs";

export class KeyboardTyper {
	constructor() {
	}
	async typeString(text: string) {
		Robotjs.typeString(text);

		// const sleepAsync = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		// for (const char of text) {
		// 	Robotjs.keyTap(char);
		// 	await sleepAsync(50 + Math.random() * 100);
		// }
	}
}

///////////////////////////////////////////////////////////////////////////////
// minitest — runs only when executed directly
///////////////////////////////////////////////////////////////////////////////
if (require.main === module) {
	(async () => {
		console.log('KeyTypingHelper minitest — typing a test string…');
		const sleepAsync = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		console.log('Waiting 5 seconds before typing the test string. Please focus the desired input field...');
		await sleepAsync(5000);
		const keyboardTyper = new KeyboardTyper();
		await keyboardTyper.typeString("Hello, world!");
		console.log('minitest passed ✓');
	})();
}