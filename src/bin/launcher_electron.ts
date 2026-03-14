// node imports
import Path from 'node:path';
import Fs from 'node:fs'

// local imports
import Electron from "electron";
import { Voice2KeyApp, Voice2KeyAppCallback } from '../app/voice2key_app';
import { GlobalShortcut } from '../libs/global_shortcut';
import { AppState } from '../app/voice2key_app';

const IPC_CHANNELS = {
	SHOW_ABOUT: 'show-about',
	MENU_ABOUT_CLICKED: 'menu-about-clicked',
	GET_TRANSCRIPTION_HISTORY: 'get-transcription-history',
	HISTORY_UPDATED: 'history-updated',
} as const;

const IPC_LOG_PREFIX = '[voice2key][ipc]';
const MAX_HISTORY_ENTRIES = 100;

type TranscriptionHistoryEntry = {
	text: string;
	createdAt: string;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class AboutDialogHelper {
	/**
	 * Reads and returns the version of VoiceToKeyboard from package.json.
	 */
	static async getVoiceToKeyboardVersion(): Promise<string> {
		const filePath = Path.join(__dirname, '../../package.json');
		const fileContent = await Fs.promises.readFile(filePath, 'utf-8');
		const packageJson = JSON.parse(fileContent);
		return packageJson.version;
	}

	/**
	 * Displays the About dialog with version and environment information.
	 * Uses Electron's dialog API to show a message box.
	 */
	static async showAboutDialog(): Promise<void> {
		console.info(`${IPC_LOG_PREFIX} showAboutDialog requested`);
		const detailContent = [
			`Version: ${await AboutDialogHelper.getVoiceToKeyboardVersion()}`,
			`Electron: ${process.versions.electron}`,
			`Node: ${process.versions.node}`
		].join('\n');
		await Electron.dialog.showMessageBox({
			type: "info",
			title: "About Voice to Keyboard",
			message: "Voice to Keyboard",
			detail: detailContent,
			buttons: ["OK"],
		});
		console.info(`${IPC_LOG_PREFIX} showAboutDialog completed`);
	}

	/**
	 * Triggers the About dialog from the tray menu.
	 * If the hidden window exists, sends an IPC message to it.
	 * Otherwise, shows the About dialog directly as a fallback.
	 * @param targetWindow The hidden BrowserWindow used for IPC communication.
	 */
	static triggerAboutFromMenu(targetWindow: Electron.BrowserWindow | null): void {
		console.info(`${IPC_LOG_PREFIX} menu click received, forwarding via ${IPC_CHANNELS.MENU_ABOUT_CLICKED}`);
		if (targetWindow && !targetWindow.isDestroyed()) {
			console.info(`${IPC_LOG_PREFIX} sending ${IPC_CHANNELS.MENU_ABOUT_CLICKED} to hidden window`);
			targetWindow.webContents.send(IPC_CHANNELS.MENU_ABOUT_CLICKED);
			return;
		}

		// Fallback for unexpected cases where the hidden window is unavailable.
		console.warn(`${IPC_LOG_PREFIX} hidden window unavailable, falling back to direct dialog`);
		void AboutDialogHelper.showAboutDialog();
	}
}

class ElectronAppHelper {

	/**
	 * Registers IPC handlers for communication between renderer and main process.
	 * Specifically, handles requests to show the About dialog.
	 */
	static setupIpcHandlers(): void {
		console.info(`${IPC_LOG_PREFIX} registering IPC handler for ${IPC_CHANNELS.SHOW_ABOUT}`);
		// Remove any existing handler to avoid duplicate handlers
		Electron.ipcMain.removeHandler(IPC_CHANNELS.SHOW_ABOUT);
		// Register a new handler for the SHOW_ABOUT channel
		Electron.ipcMain.handle(IPC_CHANNELS.SHOW_ABOUT, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.SHOW_ABOUT}`);
			return AboutDialogHelper.showAboutDialog();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY);
		Electron.ipcMain.handle(IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY, () => {
			return HistoryWindowHelper.getHistory();
		});
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class HistoryWindowHelper {
	// In-memory transcription history (newest first)
	private static transcriptionHistory: TranscriptionHistoryEntry[] = [];
	private static historyWindow: Electron.BrowserWindow | null = null;

	static appendTranscriptionToHistory(text: string): void {
		HistoryWindowHelper.transcriptionHistory.unshift({ text, createdAt: new Date().toISOString() });
		if (HistoryWindowHelper.transcriptionHistory.length > MAX_HISTORY_ENTRIES) {
			HistoryWindowHelper.transcriptionHistory.length = MAX_HISTORY_ENTRIES;
		}
		if (HistoryWindowHelper.historyWindow && !HistoryWindowHelper.historyWindow.isDestroyed()) {
			HistoryWindowHelper.historyWindow.webContents.send(IPC_CHANNELS.HISTORY_UPDATED, [...HistoryWindowHelper.transcriptionHistory]);
		}
	}

	static async openHistoryWindow(): Promise<void> {
		if (HistoryWindowHelper.historyWindow && !HistoryWindowHelper.historyWindow.isDestroyed()) {
			HistoryWindowHelper.historyWindow.focus();
			return;
		}
		HistoryWindowHelper.historyWindow = new Electron.BrowserWindow({
			width: 800,
			height: 600,
			title: 'Transcription History',
			webPreferences: {
				preload: Path.join(__dirname, 'preload.js'),
				nodeIntegration: false,
				contextIsolation: true,
			},
		});
		HistoryWindowHelper.historyWindow.on('closed', () => { HistoryWindowHelper.historyWindow = null; });
		await HistoryWindowHelper.historyWindow.loadFile(Path.join(__dirname, '../../public/history/index.html'));
	}

	static getHistory(): TranscriptionHistoryEntry[] {
		return [...HistoryWindowHelper.transcriptionHistory];
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Electron.app.on('window-all-closed', () => {
	// Don't quit the app when all windows are closed - let the tray keep it alive
	// This allows the app to continue running in the background
});


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

let dummyWindow: Electron.BrowserWindow | null = null;
Electron.app.whenReady().then(async () => {
	ElectronAppHelper.setupIpcHandlers();


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Init dummy window
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	dummyWindow = new Electron.BrowserWindow({
		show: false,
		webPreferences: {
			preload: Path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	dummyWindow.webContents.on('did-finish-load', () => {
		console.info(`${IPC_LOG_PREFIX} hidden window finished loading (${dummyWindow?.webContents.getURL() ?? 'unknown url'})`);
	});

	dummyWindow.webContents.on('render-process-gone', (_event, details) => {
		console.error(`${IPC_LOG_PREFIX} hidden window render process gone`, details);
	});

	dummyWindow.loadURL('about:blank');

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Init the tray icon
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// Create all the tray icons we need upfront so that they're cached 
	// and show up instantly when we switch them in the tray
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
			click: () => AboutDialogHelper.triggerAboutFromMenu(dummyWindow),
		},
		{
			label: 'Show Transcription History',
			click: async () => { await HistoryWindowHelper.openHistoryWindow(); },
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

	async function onAppStateIdle(transcribedText?: string) {
		trayMenu.setImage(imageNativeIdle);
		if (lastAppState === 'processing' && transcribedText) {
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
	}

	async function onAppStateRecording() {
		trayMenu.setImage(imageNativeRecording);
		new Electron.Notification({
			title: "Voice to Keyboard",
			body: "Recording..."
		}).show();
	}

	async function onAppStateProcessing() {
		trayMenu.setImage(imageNativeProcessing);
		new Electron.Notification({
			title: "Voice to Keyboard",
			body: "Processing audio..."
		}).show();
	}


	/**
	 * Callback function that gets called whenever the app state changes. This is where we can update the tray icon
	 * based on the current state (e.g. show a different icon when recording vs idle).
	 * @param appState
	 * @param transcribedText optional transcribed text to display
	 */
	const appCallback: Voice2KeyAppCallback = async (appState, transcribedText) => {
		if (appState === 'idle') {
			await onAppStateIdle(transcribedText);
			if (lastAppState === 'processing' && transcribedText) {
				HistoryWindowHelper.appendTranscriptionToHistory(transcribedText);
			}
		} else if (appState === 'recording') {
			await onAppStateRecording();
		} else if (appState === 'processing') {
			await onAppStateProcessing();
		} else {
			console.warn(`Unknown appState ${appState} in appCallback`);
			throw new Error(`Unknown appState ${appState} in appCallback`);
		}

		// update the last app state
		lastAppState = appState;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Start the app
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	await Voice2KeyApp.main(appCallback);
});
