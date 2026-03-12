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


	// const sleepAsync = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	// // Wait for a few seconds to ensure the file is fully written and ready for processing
	// await sleepAsync(3000);

	// Transcribe the recorded audio using whisper.cpp
	const transcription = await TranscriptionWhisper.transcribe(whisperPath, soundPath, {
		verbose: false,
	});

	console.log('Transcription result:', transcription);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});