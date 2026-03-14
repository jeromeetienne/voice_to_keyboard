// node imports
import Path from 'node:path';

// local imports
import Electron from "electron";
import { Voice2KeyApp, Voice2KeyAppCallback } from '../app/voice2key_app';
import { GlobalShortcut } from '../libs/global_shortcut';
import { AppState } from '../app/voice2key_app';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class ElectronAppHelper {
	static async openTranscribedTextWindow(previousDisplayWindow: Electron.BrowserWindow | null, transcribedText: string) {
		// Close previous window if still open
		if (previousDisplayWindow) {
			previousDisplayWindow.close();
		}
		// Show new window with transcribed text
		const newWindow = new Electron.BrowserWindow({
			width: 600,
			height: 300,
			show: false,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true
			}
		});

		// Load the HTML file with text passed as URL parameter
		const htmlPath = Path.join(__dirname, '../../public/transcribed_text/index.html');
		const encodedText = encodeURIComponent(transcribedText);
		newWindow.loadURL(`file://${htmlPath}?text=${encodedText}&electron=true`);
		newWindow.show();

		return newWindow

	}

	static async openAboutWindow() {
		// Get version from package.json
		const packageJsonPath = Path.join(__dirname, '../../package.json');
		const packageJson = JSON.parse(require('node:fs').readFileSync(packageJsonPath, 'utf-8'));
		const version = packageJson.version || '1.0.0';

		// Create and show the About window
		const aboutWindow = new Electron.BrowserWindow({
			width: 450,
			height: 300,
			show: false,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true
			}
		});

		// Load the HTML file with version passed as URL parameter
		const htmlPath = Path.join(__dirname, '../../public/about/index.html');
		const encodedVersion = encodeURIComponent(version);
		aboutWindow.loadURL(`file://${htmlPath}?version=${encodedVersion}&model=medium.en`);
		aboutWindow.show();

		return aboutWindow;
	}
}
Electron.app.on('window-all-closed', () => {
	// Don't quit the app when all windows are closed - let the tray keep it alive
	// This allows the app to continue running in the background
});

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

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Init the dropDown menu
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const dropDownMenu = Electron.Menu.buildFromTemplate([
		{
			label: "About VoiceToKeyboard",
			click: () => ElectronAppHelper.openAboutWindow()
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

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Check & request permissions
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// Check & request Accessibility permission
	const hasKeyboardPermissions = await GlobalShortcut.checkPermissions()
	if (hasKeyboardPermissions === false) {
		const hasPermissionsNow = await GlobalShortcut.requestPermissions()
		if (hasPermissionsNow === false) {
			console.error('Accessibility permission not granted. Key monitoring will not work.')
			// Optionally show a dialog and quit
			process.exit(1);
		}
	}

	// Check & request Microphone permission
	const hasMicrophonePermissions = await Electron.systemPreferences.askForMediaAccess('microphone')
	if (hasMicrophonePermissions === false) {
		console.error('Microphone permission not granted. Recording will not work.')
		// Optionally show a dialog and quit
		process.exit(1);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Initialise and start the app
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////


	let lastAppState: AppState | null = null; // keep track of the last app state to avoid showing duplicate notifications
	let textDisplayWindow: Electron.BrowserWindow | null = null;

	/**
	 * Callback function that gets called whenever the app state changes. This is where we can update the tray icon
	 * based on the current state (e.g. show a different icon when recording vs idle).
	 * @param appState
	 * @param transcribedText optional transcribed text to display
	 */
	const appCallback: Voice2KeyAppCallback = async (appState, transcribedText) => {
		if (appState === 'idle') {
			trayMenu.setImage(imageNativeIdle);
			if (lastAppState === 'processing' && transcribedText) {

				textDisplayWindow = await ElectronAppHelper.openTranscribedTextWindow(textDisplayWindow, transcribedText);
				// Auto-close after 10 seconds
				setTimeout(() => {
					if (textDisplayWindow && textDisplayWindow.isDestroyed() === false) {
						textDisplayWindow.close();
						textDisplayWindow = null;
					}
				}, 10000);

				new Electron.Notification({
					title: "Voice to Keyboard",
					body: "Processing Done"
				}).show();
			} else {
				new Electron.Notification({
					title: "Voice to Keyboard",
					body: "Ready to record"
				}).show();
			}
		} else if (appState === 'recording') {
			trayMenu.setImage(imageNativeRecording);
			new Electron.Notification({
				title: "Voice to Keyboard",
				body: "Recording..."
			}).show();
		} else if (appState === 'processing') {
			trayMenu.setImage(imageNativeProcessing);
			new Electron.Notification({
				title: "Voice to Keyboard",
				body: "Processing audio..."
			}).show();
		} else {
			console.warn(`Unknown appState ${appState} in appCallback`);
			throw new Error(`Unknown appState ${appState} in appCallback`);
		}

		// update the last app state
		lastAppState = appState;
	}


	// start the app
	await Voice2KeyApp.main(appCallback);
});
