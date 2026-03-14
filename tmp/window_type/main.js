const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');

    // Create application menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open File',
                    click: () => handleOpenFileDialog()
                },
                {
                    label: 'Select Directory',
                    click: () => handleSelectDirectoryDialog()
                },
                {
                    label: 'Save File',
                    click: () => handleSaveFileDialog()
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Windows',
            submenu: [
                {
                    label: 'Secondary Window',
                    click: () => createSecondaryWindow()
                },
                {
                    label: 'Modal Window',
                    click: () => createModalWindow()
                },
                {
                    label: 'About',
                    click: () => createAboutWindow()
                }
            ]
        },
        {
            label: 'Messages',
            submenu: [
                {
                    label: 'Info Message',
                    click: () => showInfoMessage()
                },
                {
                    label: 'Warning Message',
                    click: () => showWarningMessage()
                },
                {
                    label: 'Error Message',
                    click: () => showErrorMessage()
                },
                {
                    label: 'Question/Confirmation',
                    click: () => showQuestionMessage()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ============ DIALOGS ============

async function handleOpenFileDialog() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open File',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Text Files', extensions: ['txt', 'md'] },
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled) {
        console.log('Selected files:', result.filePaths);
        mainWindow.webContents.send('file-selected', result.filePaths);
    }
}

async function handleSaveFileDialog() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save File',
        defaultPath: '/Users/username/Documents/file.txt',
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled) {
        console.log('Save path:', result.filePath);
        mainWindow.webContents.send('file-saved', result.filePath);
    }
}

async function handleSelectDirectoryDialog() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Directory',
        properties: ['openDirectory']
    });

    if (!result.canceled) {
        console.log('Selected directory:', result.filePaths[0]);
        mainWindow.webContents.send('directory-selected', result.filePaths[0]);
    }
}

// ============ MESSAGE BOXES ============

async function showInfoMessage() {
    const response = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Information',
        message: 'This is an information message',
        detail: 'You can provide additional details here.',
        buttons: ['OK', 'Learn More']
    });

    console.log('Info response:', response.response);
}

async function showWarningMessage() {
    const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Warning',
        message: 'This is a warning!',
        detail: 'Please be careful with this action.',
        buttons: ['Proceed', 'Cancel']
    });

    console.log('Warning response:', response.response);
}

async function showErrorMessage() {
    const response = await dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error',
        message: 'Something went wrong!',
        detail: 'An unexpected error occurred in the application.',
        buttons: ['OK', 'Report Issue']
    });

    console.log('Error response:', response.response);
}

async function showQuestionMessage() {
    const response = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Confirmation Required',
        message: 'Are you sure you want to continue?',
        detail: 'This action cannot be undone.',
        buttons: ['Yes', 'No', 'Cancel'],
        defaultId: 1, // Default to "No"
        cancelId: 2   // Escape key maps to "Cancel"
    });

    const responses = ['Yes', 'No', 'Cancel'];
    console.log('Question response:', responses[response.response]);
    mainWindow.webContents.send('question-answer', responses[response.response]);
}

// ============ WINDOWS ============

function createSecondaryWindow() {
    const secondary = new BrowserWindow({
        width: 500,
        height: 400,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    secondary.loadFile('secondary.html');

    secondary.on('closed', () => {
        console.log('Secondary window closed');
    });
}

function createModalWindow() {
    const modal = new BrowserWindow({
        width: 400,
        height: 300,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    modal.loadFile('modal.html');

    modal.once('ready-to-show', () => {
        console.log('Modal window ready to show');
        modal.show();
    });

    modal.on('closed', () => {
        console.log('Modal window closed');
    });
}

function createAboutWindow() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About',
        message: 'Electron Window Types Demo',
        detail: [
            `Version:   ${app.getVersion()}`,
            `Electron:  ${process.versions.electron}`,
            `Node:      ${process.versions.node}`,
            `Chrome:    ${process.versions.chrome}`,
        ].join('\n'),
        buttons: ['OK'],
    });
}

// ============ IPC HANDLERS ============

ipcMain.handle('get-app-info', async () => {
    return {
        appName: app.getName(),
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome
    };
});

ipcMain.handle('open-file-dialog', () => handleOpenFileDialog());
ipcMain.handle('save-file-dialog', () => handleSaveFileDialog());
ipcMain.handle('select-directory-dialog', () => handleSelectDirectoryDialog());

ipcMain.handle('show-info-message', () => showInfoMessage());
ipcMain.handle('show-warning-message', () => showWarningMessage());
ipcMain.handle('show-error-message', () => showErrorMessage());
ipcMain.handle('show-question-message', () => showQuestionMessage());

ipcMain.handle('open-secondary-window', () => createSecondaryWindow());
ipcMain.handle('open-modal-window', () => createModalWindow());
ipcMain.handle('open-about-window', () => createAboutWindow());

// ============ APP LIFECYCLE ============

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
