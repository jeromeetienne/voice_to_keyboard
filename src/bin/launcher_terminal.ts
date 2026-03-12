// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';
import Assert from 'node:assert';

// local imports
import { Voice2KeyApp, Voice2KeyAppCallback } from '../app/voice2key_app';

async function main() {
	await Voice2KeyApp.main(async (appState) => {
		console.log(`App state changed to ${appState}`);
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});