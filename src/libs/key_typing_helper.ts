// npm imports
import Robotjs from "robotjs";

export class KeyTypingHelper {

	static async typeString(text: string) {
		Robotjs.typeString(text);

		// const sleepAsync = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		// for (const char of text) {
		// 	Robotjs.keyTap(char);
		// 	await sleepAsync(50 + Math.random() * 100);
		// }
	}
}