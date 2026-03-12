// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';

// local imports
import { TranscriptionWhisper } from '../libs/transcription_whisper';
import { GlobalShortcut, GlobalShortcutCallback } from '../libs/global_shortcut';
import { MicRecorder } from '../libs/mic_recorder';
import { KeyboardTyper } from '../libs/keyboard_typer';

type AppState = 'idle' | 'recording' | 'processing';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export type Voice2KeyAppCallback = (appState: AppState) => Promise<void>;

export class Voice2KeyApp {
	static async main(onStateChange: Voice2KeyAppCallback = async (appState) => { }) {
		const verbose = false

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	Install whisper if needed
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// install whisper.cpp if needed
		const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
		await TranscriptionWhisper.installIfNeeded(whisperPath, {
			verbose: verbose,
			modelName: 'medium.en',
		});

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	Initialize MicRecorder
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// Start the microphone recorder
		const micRecorder = new MicRecorder({ verbose: verbose });
		let appState: AppState = 'idle';
		await onStateChange(appState);

		const keyboardTyper = new KeyboardTyper();

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	Define callbacks
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const onStart: GlobalShortcutCallback = () => {
			// switch from 'idle' to 'recording' state. 
			// - If we're not in 'idle' state, ignore the event (could be a duplicate event or something else unexpected)
			if (appState !== 'idle') {
				console.warn('Received start event while not in idle state. Ignoring.');
				return;
			}
			appState = 'recording';

			// process event with an async IIFE so we can use await
			(async () => {
				await onStateChange(appState);

				console.log('start recording')
				micRecorder.startRecording();
			})().catch((err) => {
				console.error('Error in onStart handler:', err);
			});
		}
		const onStop: GlobalShortcutCallback = () => {
			// switch from 'recording' to 'processing' state. 
			// - If we're not in 'recording' state, ignore the event (could be a duplicate event or something else unexpected)
			if (appState !== 'recording') {
				console.warn('Received stop event while not in recording state. Ignoring.');
				return;
			}
			appState = 'processing';

			// process event with an async IIFE so we can use await
			(async () => {
				await onStateChange(appState);

				console.log('stop recording');
				const soundBuffer = await micRecorder.stopRecording();

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
				await keyboardTyper.typeString(transcriptionText);

				appState = 'idle';
				await onStateChange(appState);
			})().catch((err) => {
				console.error('Error in onStop handler:', err);
			});
		}

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const ioBindingHelper = new GlobalShortcut(onStart, onStop)
		ioBindingHelper.start()
	}

}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

if (require.main === module) {
	Voice2KeyApp.main(async (appState) => {
		console.log(`App state changed to ${appState}`);
	}).catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
