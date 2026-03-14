const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
    SHOW_ABOUT: 'show-about',
    MENU_ABOUT_CLICKED: 'menu-about-clicked',
    GET_TRANSCRIPTION_HISTORY: 'get-transcription-history',
};

const IPC_LOG_PREFIX = '[voice2key][ipc][preload]';

ipcRenderer.on(IPC_CHANNELS.MENU_ABOUT_CLICKED, () => {
    console.info(`${IPC_LOG_PREFIX} received ${IPC_CHANNELS.MENU_ABOUT_CLICKED}, invoking ${IPC_CHANNELS.SHOW_ABOUT}`);
    void ipcRenderer.invoke(IPC_CHANNELS.SHOW_ABOUT).catch((error) => {
        console.error(`${IPC_LOG_PREFIX} invoke failed for ${IPC_CHANNELS.SHOW_ABOUT}`, error);
    });
});

console.info(`${IPC_LOG_PREFIX} preload initialized`);

contextBridge.exposeInMainWorld('electronAPI', {
    showAbout: () => {
        console.info(`${IPC_LOG_PREFIX} renderer requested ${IPC_CHANNELS.SHOW_ABOUT}`);
        return ipcRenderer.invoke(IPC_CHANNELS.SHOW_ABOUT);
    },
    getTranscriptionHistory: () => {
        console.info(`${IPC_LOG_PREFIX} renderer requested ${IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY}`);
        return ipcRenderer.invoke(IPC_CHANNELS.GET_TRANSCRIPTION_HISTORY);
    },
});
