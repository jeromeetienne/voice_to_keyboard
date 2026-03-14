const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
	SHOW_ABOUT: 'show-about',
	MENU_ABOUT_CLICKED: 'menu-about-clicked',
	GET_TRANSCRIPTION_HISTORY: 'get-transcription-history',
	HISTORY_UPDATED: 'history-updated',
	GET_CONFIG: 'get-config',
	SAVE_CONFIG: 'save-config',
	GET_AVAILABLE_LANGUAGES: 'get-available-languages',
	GET_AVAILABLE_MODELS: 'get-available-models',
	GET_DEFAULT_CONFIG: 'get-default-config',
};

ipcRenderer.on(IPC_CHANNELS.MENU_ABOUT_CLICKED, () => {
	void ipcRenderer.invoke(IPC_CHANNELS.SHOW_ABOUT);
});

contextBridge.exposeInMainWorld('electronAPI', {
	showAbout: () => ipcRenderer.invoke(IPC_CHANNELS.SHOW_ABOUT),
	getTranscriptionHistory: () => ipcRenderer.invoke(IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY),
	/**
	 * @param {(entries: any) => void} callback
	 */
	onHistoryUpdated: (callback) => {
		ipcRenderer.on(IPC_CHANNELS.HISTORY_UPDATED, (_event, entries) => callback(entries));
	},
	getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
	saveConfig: (config) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, config),
	getAvailableLanguages: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AVAILABLE_LANGUAGES),
	getAvailableModels: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AVAILABLE_MODELS),
	getDefaultConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DEFAULT_CONFIG),
});
