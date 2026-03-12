// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';
import Assert from 'node:assert';

// local imports
import { TranscriptionWhisper } from '../libs/transcription_whisper';
import { IOBindingHelper, IOBindingCallback } from '../libs/iobinding_helper';
import { MicRecorder } from '../libs/mic_recorder';
import { KeyTypingHelper } from '../libs/key_typing_helper';

type AppState = 'idle' | 'recording' | 'processing';

async function main() {
	const verbose = false
	// install whisper.cpp if needed
	const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
	await TranscriptionWhisper.installIfNeeded(whisperPath, {
		verbose: verbose,
		modelName: 'medium.en',
	});

	const recorder = new MicRecorder({ verbose: true });
	let appState: AppState = 'idle';
	const onStart: IOBindingCallback = () => {
		// switch from 'idle' to 'recording' state. 
		// - If we're not in 'idle' state, ignore the event (could be a duplicate event or something else unexpected)
		if (appState !== 'idle') {
			console.warn('Received start event while not in idle state. Ignoring.');
			return;
		}
		Assert.ok(appState === 'idle', 'Received start event while not in idle state');
		appState = 'recording';

		console.log('start recording')
		recorder.startRecording();
	}
	const onStop: IOBindingCallback = () => {
		// switch from 'recording' to 'processing' state. 
		// - If we're not in 'recording' state, ignore the event (could be a duplicate event or something else unexpected)
		if (appState !== 'recording') {
			console.warn('Received stop event while not in recording state. Ignoring.');
			return;
		}
		Assert.ok(appState === 'recording', 'Received stop event while not in recording state');
		appState = 'processing';

		(async () => {
			console.log('stop recording');
			const soundBuffer = await recorder.stopRecording();

			// Save the recorded audio to a file
			const soundPath = Path.join(Os.tmpdir(), `sound-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
			await Fs.promises.writeFile(soundPath, soundBuffer);
			console.log(`Sound recorded and saved to ${soundPath}`);


			// Transcribe the recorded audio using whisper.cpp
			console.log('Transcribing audio with whisper.cpp...');
			const transcriptionText = await TranscriptionWhisper.transcribe(whisperPath, soundPath, {
				verbose: verbose,
				language: 'en',
			});

			// Delete the temporary audio file
			await Fs.promises.unlink(soundPath);

			// Log the transcribed text
			console.log('Text transcribed:', transcriptionText);

			// Type the transcribed text using robotjs
			await KeyTypingHelper.typeString(transcriptionText);

			appState = 'idle';
		})().catch((err) => {
			console.error('Error in onStop handler:', err);
		});
	}
	const ioBindingHelper = new IOBindingHelper(onStart, onStop)
	ioBindingHelper.start()

}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});