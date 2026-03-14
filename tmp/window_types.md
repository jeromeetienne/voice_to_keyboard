# Electron Window Types and Dialogs

## Overview
Electron provides several ways to create and manage windows, including main application windows, dialogs, and message boxes.

---

## 1. BrowserWindow - Main Application Window

The primary window type in Electron for displaying web content.

```javascript
const { BrowserWindow } = require('electron');

// Create main window
const mainWindow = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true
  }
});

mainWindow.loadFile('index.html');
mainWindow.webContents.openDevTools(); // Optional: open dev tools
```

---

## 2. Dialog - File Selection

### Open File Dialog
```javascript
const { dialog } = require('electron');

async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    console.log('Selected files:', result.filePaths);
  }
}
```

### Save File Dialog
```javascript
async function saveFileDialog() {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File',
    defaultPath: '/Users/username/Documents/file.txt',
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    console.log('Save path:', result.filePath);
  }
}
```

### Directory Selection Dialog
```javascript
async function selectDirectoryDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select a folder'
  });

  if (!result.canceled) {
    console.log('Selected directory:', result.filePaths[0]);
  }
}
```

---

## 3. Message Box - Notifications and Confirmations

### Simple Info Message
```javascript
const { dialog } = require('electron');

dialog.showMessageBox(mainWindow, {
  type: 'info',
  title: 'Information',
  message: 'This is an information message',
  buttons: ['OK']
});
```

### Warning Message
```javascript
dialog.showMessageBox(mainWindow, {
  type: 'warning',
  title: 'Warning',
  message: 'This is a warning!',
  detail: 'Please be careful with this action.',
  buttons: ['OK', 'Cancel']
});
```

### Error Message
```javascript
dialog.showMessageBox(mainWindow, {
  type: 'error',
  title: 'Error',
  message: 'Something went wrong!',
  detail: 'An unexpected error occurred.',
  buttons: ['OK']
});
```

### Question (Confirmation) Dialog
```javascript
async function confirmationDialog() {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Confirmation',
    message: 'Are you sure?',
    detail: 'This action cannot be undone.',
    buttons: ['Yes', 'No', 'Cancel'],
    defaultId: 1, // Default button is "No"
    cancelId: 2  // Escape key maps to "Cancel"
  });

  console.log('User clicked button:', result.response);
  // response: 0 = Yes, 1 = No, 2 = Cancel
}
```

### Async Message Box with Return Value
```javascript
async function asyncMessageBox() {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Confirm Action',
    message: 'Do you want to proceed?',
    buttons: ['OK', 'Cancel']
  });

  if (response === 0) {
    console.log('User clicked OK');
  } else {
    console.log('User clicked Cancel');
  }
}
```

---

## 4. Child Window / Secondary Window

Create additional windows from your main window.

```javascript
let secondaryWindow;

function createSecondaryWindow() {
  secondaryWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow, // Make it a child of main window
    modal: true,       // Make it modal (blocks interaction with parent)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  secondaryWindow.loadFile('secondary.html');

  secondaryWindow.on('closed', () => {
    secondaryWindow = null;
  });
}
```

---

## 5. Modal Dialog Window

A modal window that prevents interaction with other windows until closed.

```javascript
function createModalWindow() {
  const modal = new BrowserWindow({
    width: 500,
    height: 300,
    parent: mainWindow,
    modal: true,
    show: false // Don't show until ready
  });

  modal.loadFile('modal.html');

  // Show when ready
  modal.once('ready-to-show', () => {
    modal.show();
  });

  modal.on('closed', () => {
    console.log('Modal closed');
  });
}
```

---

## 6. About Window

A common secondary window for app information.

```javascript
function createAboutWindow() {
  const about = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  about.loadFile('about.html');
}
```

---

## 7. Window Options Summary

| Option | Type | Description |
|--------|------|-------------|
| `width` | number | Window width in pixels |
| `height` | number | Window height in pixels |
| `modal` | boolean | Block input to other windows |
| `parent` | BrowserWindow | Parent window for child windows |
| `show` | boolean | Show window on creation |
| `resizable` | boolean | Allow window resizing |
| `minimizable` | boolean | Show minimize button |
| `maximizable` | boolean | Show maximize button |
| `closable` | boolean | Show close button |
| `alwaysOnTop` | boolean | Keep window on top |
| `fullscreen` | boolean | Start in fullscreen mode |
| `webPreferences` | object | Security and rendering options |

---

## 8. Complete Example: Main Process

```javascript
const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Create menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          click: () => openFileDialog()
        },
        {
          label: 'Exit',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => createAboutWindow()
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }]
  });

  if (!result.canceled) {
    // Handle file selection
  }
}

function createAboutWindow() {
  const about = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true
  });

  about.loadFile('about.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

---

## 9. Dialog Types Summary

| Dialog Type | Use Case |
|-------------|----------|
| `showOpenDialog` | Select file(s) or folder for opening |
| `showSaveDialog` | Select location and name for saving |
| `showMessageBox` | Display message with buttons (info, warning, error, question) |
| `showErrorBox` | Display error with OK button only |
| `showCertificateTrustDialog` | Show SSL cert trust dialog |
| `showItemInFolder` | Open file in file explorer |

---

## Notes

- Always use `async/await` with dialog methods for better error handling
- Set `modal: true` for user attention-requiring windows
- Use `parent` property to establish window hierarchy
- Always set `contextIsolation: true` and `nodeIntegration: false` for security
- Handle window close events to clean up references and prevent memory leaks
