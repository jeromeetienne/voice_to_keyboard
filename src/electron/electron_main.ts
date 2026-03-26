// node imports
import Path from 'node:path';

// local imports
import Electron from "electron";
import { Voice2KbdApp, Voice2KbdAppCallback } from '../app/voice2key_app';
import { GlobalShortcut } from '../libs/global_shortcut';
import { AppState } from '../app/voice2key_app';
import { AppConfig, AppConfigManager } from '../libs/app_config';
import { TranscriptionHistoryManager } from '../libs/transcription_history';
import { IPC_LOG_PREFIX } from './libs/ipc_channels';
import { AboutDialogHelper } from './libs/about_dialog_helper';
import { ConfigWindowHelper } from './libs/config_window_helper';
import { HistoryWindowHelper } from './libs/history_window_helper';
import { ElectronAppHelper } from './libs/electron_app_helper';
import { ProjectPath as ProjectPath } from './libs/project_path';

const MAX_HISTORY_ENTRIES = 100;

export class ElectronMain {
	static async main(appConfig: AppConfig) {
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

			// Do a 'initialization' notification to let the user know the app is starting up (since it can take a few seconds)
			new Electron.Notification({
				title: "Voice to Keyboard",
				body: "Initializing application..."
			}).show();


			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////
			//	Init dummy window
			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////

			dummyWindow = new Electron.BrowserWindow({
				show: false,
				webPreferences: {
					preload: ProjectPath.PRELOAD_JS,
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
			const imageIdlePath = Path.join(ProjectPath.ROOT, "assets/images/tray_icons/icon-mic-fill-20x20.png");
			const imageIdleNative = Electron.nativeImage.createFromPath(imageIdlePath);
			// set the idle icon as a template image so that it can adapt to light/dark themes and have proper transparency on macOS
			imageIdleNative.setTemplateImage(true);

			const imageRecordingPath = Path.join(ProjectPath.ROOT, "assets/images/tray_icons/icon-record-btn-fill-20x20.png");
			const imageRecordingNative = Electron.nativeImage.createFromPath(imageRecordingPath);

			const imageProcessingPath = Path.join(ProjectPath.ROOT, "assets/images/tray_icons/icon-soundwave-20x20.png");
			const imageProcessingNative = Electron.nativeImage.createFromPath(imageProcessingPath);

			// initialize the tray icon with the idle icon
			const trayMenu = new Electron.Tray(imageIdleNative);

			const imageDockPath = Path.join(ProjectPath.ROOT, "assets/images/dock_icons/icon-mic-fill-512x512.png");
			const imageDockNative = Electron.nativeImage.createFromPath(imageDockPath);
			Electron?.app?.dock?.setIcon(imageDockNative);

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
					label: 'Configuration',
					click: async () => { await ConfigWindowHelper.openConfigWindow(); },
				},
				{
					label: 'History',
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
				{ role: "quit", label: "Quit" }
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
				console.info(`[Voice2KbdAppCallback] App state changed to idle. Transcribed text: ${transcribedText ?? 'N/A'}`);
				trayMenu.setImage(imageIdleNative);
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
				console.info(`[Voice2KbdAppCallback] App state changed to recording.`);
				trayMenu.setImage(imageRecordingNative);
				new Electron.Notification({
					title: "Voice to Keyboard",
					body: "Recording..."
				}).show();
			}

			async function onAppStateProcessing() {
				console.info(`[Voice2KbdAppCallback] App state changed to processing.`);
				trayMenu.setImage(imageProcessingNative);
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
			const appCallback: Voice2KbdAppCallback = async (appState, transcribedText) => {
				if (appState === 'idle') {
					await onAppStateIdle(transcribedText);
					if (lastAppState === 'processing' && transcribedText) {
						await HistoryWindowHelper.appendTranscriptionToHistory(transcribedText);
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
			//	Initialize Configuration Window Helper
			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////

			const appConfigManager = new AppConfigManager();
			ConfigWindowHelper.setAppConfigManager(appConfigManager);
			ConfigWindowHelper.setCurrentConfig(appConfig);

			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////
			//	Initialize Transcription History Manager
			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////

			const historyManager = new TranscriptionHistoryManager(MAX_HISTORY_ENTRIES, ProjectPath.ROOT);
			await historyManager.load();
			HistoryWindowHelper.setHistoryManager(historyManager);
			console.info(`[ElectronMain] Transcription history loaded from: ${historyManager.getFilePath()}`);

			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////
			//	Start the app
			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////

			await Voice2KbdApp.main(appConfig, appCallback);
		});

	}
}
