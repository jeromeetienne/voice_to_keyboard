// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';

// local imports
import { AudioHelper } from '../libs/audio_helper';
import { TranscriptionWhisper } from '../libs/transcription_whisper';
import { KeyTypingHelper } from '../libs/key_typing_helper';

async function main() {
	const verbose = false
	// install whisper.cpp if needed
	const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
	await TranscriptionWhisper.installIfNeeded(whisperPath, {
		verbose: verbose,
		modelName: 'medium.en',
	});

	// Record audio from the microphone
	const soundBuffer = await AudioHelper.recordMicrophone({
		verbose: true,
	});

	// Save the recorded audio to a file
	const soundPath = Path.join(Os.tmpdir(), `sound-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
	await Fs.promises.writeFile(soundPath, soundBuffer);
	console.log(`Sound recorded and saved to ${soundPath}`);


	console.log('Transcribing audio with whisper.cpp...');
	// Transcribe the recorded audio using whisper.cpp
	const transcriptionText = await TranscriptionWhisper.transcribe(whisperPath, soundPath, {
		verbose: verbose,
		language: 'en',
	});

	// Delete the temporary audio file
	await Fs.promises.unlink(soundPath);

	// Log the transcribed text
	console.log('Text transcribed:', transcriptionText);

	const sleepAsync = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	// Wait a bit before typing to let the user focus the desired input field
	console.log('Waiting 5 seconds before typing the transcribed text. Please focus the desired input field...');
	await sleepAsync(2000);

	// Type the transcribed text using robotjs
	await KeyTypingHelper.typeString(transcriptionText);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});