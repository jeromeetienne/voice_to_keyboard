// node imports
import Path from 'node:path';

// local imports
import Electron from "electron";
import { Voice2KeyApp, Voice2KeyAppCallback } from '../app/voice2key_app';


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
	const trayMenu = new Electron.Tray(imageNativeIdle);


	const dropDownMenu = Electron.Menu.buildFromTemplate([
		{
			role: "about",
			label: "About VoiceToKeyboard"
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
	trayMenu.setContextMenu(dropDownMenu);
	trayMenu.setToolTip("Voice to Keyboard");

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
			trayMenu.setImage(imageNativeIdle);
		} else if (appState === 'recording') {
			notification.show();
			trayMenu.setImage(imageNativeRecording);
		} else if (appState === 'processing') {
			trayMenu.setImage(imageNativeProcessing);
		} else {
			console.warn(`Unknown appState ${appState} in appCallback`);
			throw new Error(`Unknown appState ${appState} in appCallback`);
		}
	}

	// start the app
	await Voice2KeyApp.main(appCallback);
});
