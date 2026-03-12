// node imports
import Path from 'node:path';
import Fs from 'node:fs';

// local imports
import { AudioHelper } from '../libs/audio_helper';
import { TranscriptionWhisper } from '../libs/transcription_whisper';


async function main() {
	// install whisper.cpp if needed
	const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
	await TranscriptionWhisper.installIfNeeded(whisperPath, {
		verbose: true,
		modelName: 'medium.en',
	});

	// Record audio from the microphone
	const soundBuffer = await AudioHelper.recordMicrophone();

	// Save the recorded audio to a file
	const soundPath = Path.resolve(__dirname, '../../outputs/output.wav');
	await Fs.promises.writeFile(soundPath, soundBuffer);
	console.log(`Sound recorded and saved to ${soundPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});