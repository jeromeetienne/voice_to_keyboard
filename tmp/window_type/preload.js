const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    // Dialogs (invoked from renderer buttons)
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
    selectDirectoryDialog: () => ipcRenderer.invoke('select-directory-dialog'),

    // Message boxes
    showInfoMessage: () => ipcRenderer.invoke('show-info-message'),
    showWarningMessage: () => ipcRenderer.invoke('show-warning-message'),
    showErrorMessage: () => ipcRenderer.invoke('show-error-message'),
    showQuestionMessage: () => ipcRenderer.invoke('show-question-message'),

    // Windows
    openSecondaryWindow: () => ipcRenderer.invoke('open-secondary-window'),
    openModalWindow: () => ipcRenderer.invoke('open-modal-window'),
    openAboutWindow: () => ipcRenderer.invoke('open-about-window'),
});
