import Electron from 'electron';
import { IPC_CHANNELS, IPC_LOG_PREFIX } from './ipc_channels';
import { AboutDialogHelper } from './about_dialog_helper';
import { ConfigWindowHelper } from './config_window_helper';
import { HistoryWindowHelper } from './history_window_helper';

export class ElectronAppHelper {

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
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY}`);
			return HistoryWindowHelper.getHistory();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.GET_CONFIG);
		Electron.ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.GET_CONFIG}`);
			return ConfigWindowHelper.getConfig();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.SAVE_CONFIG);
		Electron.ipcMain.handle(IPC_CHANNELS.SAVE_CONFIG, (_event, appConfig) => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.SAVE_CONFIG} with config:`, appConfig);
			return ConfigWindowHelper.saveConfig(appConfig);
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.GET_AVAILABLE_LANGUAGES);
		Electron.ipcMain.handle(IPC_CHANNELS.GET_AVAILABLE_LANGUAGES, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.GET_AVAILABLE_LANGUAGES}`);
			return ConfigWindowHelper.getAvailableLanguages();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.GET_AVAILABLE_MODELS);
		Electron.ipcMain.handle(IPC_CHANNELS.GET_AVAILABLE_MODELS, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.GET_AVAILABLE_MODELS}`);
			return ConfigWindowHelper.getAvailableModels();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.GET_DEFAULT_CONFIG);
		Electron.ipcMain.handle(IPC_CHANNELS.GET_DEFAULT_CONFIG, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.GET_DEFAULT_CONFIG}`);
			return ConfigWindowHelper.getDefaultConfig();
		});

		Electron.ipcMain.removeHandler(IPC_CHANNELS.CLEAR_HISTORY);
		Electron.ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
			console.info(`${IPC_LOG_PREFIX} ipcMain.handle invoked for ${IPC_CHANNELS.CLEAR_HISTORY}`);
			return HistoryWindowHelper.clearHistory();
		});
	}
}
