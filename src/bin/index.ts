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

async function main() {
	const verbose = false
	// install whisper.cpp if needed
	const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
	await TranscriptionWhisper.installIfNeeded(whisperPath, {
		verbose: verbose,
		modelName: 'medium.en',
	});

	const recorder = new MicRecorder({ verbose: true });
	let state: 'idle' | 'recording' | 'processing' = 'idle';
	const onStart: IOBindingCallback = () => {
		console.log('start recording')

		if (state !== 'idle') {
			console.warn('Received start event while not in idle state. Ignoring.');
			return;
		}
		state = 'recording';
		recorder.startRecording();
	}
	const onStop: IOBindingCallback = () => {
		console.log('stop recording');
		(async () => {
			const soundBuffer = await recorder.stopRecording();
			Assert.ok(state === 'recording', 'Received stop event while not in recording state');
			state = 'processing';

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

			state = 'idle';
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