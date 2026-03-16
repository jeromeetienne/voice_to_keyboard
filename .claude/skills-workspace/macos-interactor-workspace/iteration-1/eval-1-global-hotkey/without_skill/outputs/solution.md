# Global Hotkey in Electron (Background Operation)

## Problem

Local hotkeys registered with keyboard event listeners only work when the app window is focused. To capture keyboard input even when the app is running in the background or minimized, you need to register a **global hotkey** that the operating system handles at the system level.

## Solution

Use Electron's built-in `globalShortcut` module to register hotkeys that work system-wide, regardless of window focus.

### Basic Implementation

```javascript
const { app, BrowserWindow, globalShortcut } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Register global hotkey: Cmd+Shift+K
  const shortcutKey = 'CmdOrCtrl+Shift+K';

  const ret = globalShortcut.register(shortcutKey, () => {
    console.log('Global hotkey (Cmd+Shift+K) pressed!');

    // Trigger your recording logic here
    mainWindow.webContents.send('start-recording');
  });

  if (!ret) {
    console.log('Failed to register global shortcut');
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts when app is closing
  globalShortcut.unregisterAll();
});
```

### Complete Working Example with Recording

**main.js (Main Process)**
```javascript
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isRecording = false;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Register global hotkey for Cmd+Shift+K
  const ret = globalShortcut.register('CmdOrCtrl+Shift+K', () => {
    if (!isRecording) {
      isRecording = true;
      console.log('Recording started via global hotkey');
      mainWindow.webContents.send('recording-started');
    } else {
      isRecording = false;
      console.log('Recording stopped via global hotkey');
      mainWindow.webContents.send('recording-stopped');
    }
  });

  if (!ret) {
    console.log('Failed to register global shortcut');
  }

  // Log all registered shortcuts
  console.log('Registered shortcuts:', globalShortcut.getRegisteredHotkeys());
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Optional: Allow renderer to trigger recording via IPC
ipcMain.on('toggle-recording', (event) => {
  isRecording = !isRecording;
  event.sender.send('recording-toggled', isRecording);
});
```

**preload.js (Preload Script)**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onRecordingStarted: (callback) => ipcRenderer.on('recording-started', callback),
  onRecordingStopped: (callback) => ipcRenderer.on('recording-stopped', callback),
  toggleRecording: () => ipcRenderer.send('toggle-recording')
});
```

**renderer.js (Renderer Process)**
```javascript
window.electronAPI.onRecordingStarted(() => {
  console.log('Recording started');
  document.getElementById('status').textContent = 'Recording...';
  // Start your recording logic here
});

window.electronAPI.onRecordingStopped(() => {
  console.log('Recording stopped');
  document.getElementById('status').textContent = 'Ready';
  // Stop your recording logic here
});
```

## Key Points

### 1. Use `CmdOrCtrl` for Cross-Platform Compatibility
- `CmdOrCtrl` automatically translates to `Cmd` on macOS and `Ctrl` on Windows/Linux
- Use `CmdOrCtrl+Shift+K` instead of hardcoding `Cmd+Shift+K`

### 2. Unregister on Quit
Always unregister hotkeys in the `will-quit` event:
```javascript
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### 3. Check Registration Success
```javascript
const ret = globalShortcut.register(shortcut, callback);
if (!ret) {
  console.log('Failed to register - hotkey may be in use by another app');
}
```

### 4. Handle Window Close Without Quitting App
If your window can close without quitting the app:
```javascript
mainWindow.on('closed', () => {
  mainWindow = null;
  // Optionally unregister hotkeys when window closes
  globalShortcut.unregisterAll();
});
```

## Permissions (macOS)

On macOS, users may need to grant accessibility permissions. The system will prompt the first time the hotkey is pressed. Alternatively, add to `Info.plist`:
```xml
<key>NSAppleEventsUsageDescription</key>
<string>This app needs to listen for global keyboard shortcuts</string>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hotkey not working | Check if another app has registered the same shortcut |
| Only works when focused | Ensure you're using `globalShortcut`, not local listeners |
| App crashes on hotkey | Wrap callback in try-catch and ensure mainWindow exists |
| macOS permission denied | Grant accessibility permissions in System Preferences |

## Verify Registration

```javascript
// Log all registered hotkeys
console.log('Registered hotkeys:', globalShortcut.getRegisteredHotkeys());

// Check if specific hotkey is registered
const isRegistered = globalShortcut.isRegistered('CmdOrCtrl+Shift+K');
console.log('CmdOrCtrl+Shift+K registered:', isRegistered);
```

## Important Notes

- `globalShortcut` requires Electron version 1.0+
- The callback executes in the main process
- Use IPC (`ipcRenderer.send()` and `ipcMain.on()`) to communicate with renderer process
- Global shortcuts work even when window is minimized or app is in background
- Some hotkeys may be reserved by the OS (e.g., Cmd+Q on macOS)
