const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
	SHOW_ABOUT: 'show-about',
	MENU_ABOUT_CLICKED: 'menu-about-clicked',
	GET_TRANSCRIPTION_HISTORY: 'get-transcription-history',
	HISTORY_UPDATED: 'history-updated',
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
});
