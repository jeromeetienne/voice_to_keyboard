// local imports
import { Voice2KeyApp } from '../app/voice2key_app';
import { AppConfigManager } from '../libs/app_config';

async function main() {
	// load the app configuration
	const appConfigManager = new AppConfigManager();
	const appConfig = appConfigManager.load() ?? AppConfigManager.getDefaultConfig();

	// run the app
	await Voice2KeyApp.main(appConfig, async (appState, transcribedText) => {
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