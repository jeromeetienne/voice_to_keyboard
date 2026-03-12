// node imports
import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';
import Assert from 'node:assert';

// local imports
import Electron from "electron";
import { TranscriptionWhisper } from '../libs/transcription_whisper';
import { IOBindingHelper, IOBindingCallback } from '../libs/iobinding_helper';
import { MicRecorder } from '../libs/mic_recorder';
import { KeyTypingHelper } from '../libs/key_typing_helper';

type AppState = 'idle' | 'recording' | 'processing';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

type Voice2KeyAppCallback = (appState: AppState) => Promise<void>;

async function voice2KeyApp(onStateChange: Voice2KeyAppCallback = async (appState) => { }) {
	const verbose = false
	// install whisper.cpp if needed
	const whisperPath = Path.resolve(__dirname, '../../outputs/whisper.cpp');
	await TranscriptionWhisper.installIfNeeded(whisperPath, {
		verbose: verbose,
		modelName: 'medium.en',
	});

	const recorder = new MicRecorder({ verbose: true });
	let appState: AppState = 'idle';
	await onStateChange(appState);
	const onStart: IOBindingCallback = () => {
		// switch from 'idle' to 'recording' state. 
		// - If we're not in 'idle' state, ignore the event (could be a duplicate event or something else unexpected)
		if (appState !== 'idle') {
			console.warn('Received start event while not in idle state. Ignoring.');
			return;
		}
		Assert.ok(appState === 'idle', 'Received start event while not in idle state');
		appState = 'recording';

		// process event with an async IIFE so we can use await
		(async () => {
			await onStateChange(appState);

			console.log('start recording')
			recorder.startRecording();
		})().catch((err) => {
			console.error('Error in onStart handler:', err);
		});
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

		// process event with an async IIFE so we can use await
		(async () => {
			await onStateChange(appState);

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
			await onStateChange(appState);
		})().catch((err) => {
			console.error('Error in onStop handler:', err);
		});
	}
	const ioBindingHelper = new IOBindingHelper(onStart, onStop)
	ioBindingHelper.start()
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


Electron.app.whenReady().then(async () => {
	// Create all the tray icons we need upfront so that they're cached and show up instantly when we switch them in the tray
	const imageNativeIdle = Electron.nativeImage.createFromPath(Path.join(__dirname, "../../assets/images/icon-mic-20x20.png"));
	imageNativeIdle.setTemplateImage(true);
	const imageNativeRecording = Electron.nativeImage.createFromPath(Path.join(__dirname, "../../assets/images/icon-mic-fill-20x20.png"));
	imageNativeRecording.setTemplateImage(true);
	const imageNativeProcessing = Electron.nativeImage.createFromPath(Path.join(__dirname, "../../assets/images/icon-soundwave-20x20.png"));
	imageNativeProcessing.setTemplateImage(true);


	// initialize the tray icon with the idle icon
	const tray = new Electron.Tray(imageNativeIdle);


	const menu = Electron.Menu.buildFromTemplate([
		{
			role: "about",
			// click
		},
		{
			label: "Github",
			click: () => Electron.shell.openExternal("https://github.com/jeromeetienne/voice_to_keyboard")
		},
		{
			label: "Documentation",
			click: () => Electron.shell.openExternal("https://github.com/jeromeetienne/voice_to_keyboard#readme")
		},
		{ type: "separator" },
		{ role: "quit", label: "Quit VoiceToKeyboard" }
	]);
	tray.setContextMenu(menu);
	tray.setToolTip("Voice to Keyboard");

	const notification = new Electron.Notification({
		title: "Recording started",
		body: "Press the hotkey again to stop recording"
	});

	/**
	 * Callback function that gets called whenever the app state changes. This is where we can update the tray icon 
	 * based on the current state (e.g. show a different icon when recording vs idle).
	 * @param appState 
	 */
	const appCallback: Voice2KeyAppCallback = async (appState) => {
		if (appState === 'idle') {
			tray.setImage(imageNativeIdle);
		} else if (appState === 'recording') {
			notification.show();
			tray.setImage(imageNativeRecording);
		} else if (appState === 'processing') {
			tray.setImage(imageNativeProcessing);
		} else {
			console.warn(`Unknown appState ${appState} in appCallback`);
			throw new Error(`Unknown appState ${appState} in appCallback`);
		}
	}

	await voice2KeyApp(appCallback);
});
