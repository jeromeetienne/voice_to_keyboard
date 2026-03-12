// local imports
import { Voice2KeyApp } from '../app/voice2key_app';

async function main() {
	await Voice2KeyApp.main(async (appState) => {
		console.log(`App state changed to ${appState}`);
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});