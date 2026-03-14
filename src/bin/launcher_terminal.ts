// local imports
import { Voice2KeyApp } from '../app/voice2key_app';

async function main() {
	await Voice2KeyApp.main(async (appState, transcribedText) => {
		console.log(`App state changed to ${appState}`);
		if (transcribedText) {
			console.log(`Transcribed text: ${transcribedText}`);
		}
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});