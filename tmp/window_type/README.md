# Electron Window Types Demo

A complete working example demonstrating all major Electron window types, dialogs, and message boxes.

## Features

- **File Dialogs**: Open file, save file, and select directory dialogs
- **Message Boxes**: Info, warning, error, and question/confirmation message boxes
- **Window Types**: Secondary windows, modal windows, and about windows
- **IPC Communication**: Secure communication between main and renderer processes
- **Modern UI**: Beautiful gradient interfaces with responsive design

## Project Structure

```
window_type/
├── package.json          # Project metadata and dependencies
├── main.js              # Main process (Electron backend)
├── preload.js           # Secure IPC bridge
├── index.html           # Main window UI
├── secondary.html       # Secondary window example
├── modal.html           # Modal window example
├── about.html           # About window example
└── README.md            # This file
```

## Installation and Running

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Steps

1. **Navigate to the project folder:**
   ```bash
   cd tmp/window_type
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app:**
   ```bash
   npm start
   ```

   Or for development with logging:
   ```bash
   npm run dev
   ```

## What You'll Learn

### File Dialogs
- `showOpenDialog()` - Select files or directories
- `showSaveDialog()` - Save file with custom location
- Multiple file selection
- File filters and extensions

### Message Boxes
- `showMessageBox()` with different types:
  - `info` - Information messages
  - `warning` - Warning messages
  - `error` - Error messages
  - `question` - Yes/No/Cancel dialogs
- Button callbacks
- Return value handling

### Windows

#### Main Window (BrowserWindow)
- Primary application window
- Contains the control panel UI

#### Secondary Window
- Child of main window
- Non-modal (doesn't block parent interaction)
- Can be closed independently

#### Modal Window
- Blocks interaction with parent window
- Good for critical confirmations
- Requires user action to proceed

#### About Window
- Typical secondary window
- Shows app information
- Non-resizable, non-maximizable
- Displays version and runtime info

## Code Examples

### Opening a File Dialog
```javascript
async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    console.log('Selected files:', result.filePaths);
  }
}
```

### Showing a Message Box
```javascript
async function showConfirmation() {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Confirm',
    message: 'Are you sure?',
    buttons: ['Yes', 'No', 'Cancel']
  });

  // result.response: 0 = Yes, 1 = No, 2 = Cancel
}
```

### Creating a Modal Window
```javascript
const modal = new BrowserWindow({
  width: 400,
  height: 300,
  parent: mainWindow,
  modal: true,
  show: false
});

modal.loadFile('modal.html');
modal.once('ready-to-show', () => modal.show());
```

## Key Concepts

### Security
- `contextIsolation: true` - Isolates renderer from Node.js
- `nodeIntegration: false` - Disables Node.js in renderer
- `preload.js` - Safe IPC bridge using `contextBridge`

### IPC Communication
- Renderer sends events through preload bridge
- Main process receives and processes events
- Results sent back to renderer via IPC

### Window Hierarchy
- Main window is the root
- Secondary windows have `parent: mainWindow`
- Modal windows block parent interaction

## Menu Integration

All features are accessible through the menu bar:
- **File** menu: Dialogs
- **Windows** menu: Window types
- **Messages** menu: Message boxes

## Testing

Try these scenarios:

1. **Open multiple secondary windows** - They should stack independently
2. **Open a modal window** - You should not be able to interact with main window
3. **Select files** - See the file paths logged in the output
4. **Answer questions** - See which button you clicked
5. **Switch between windows** - Use Alt+Tab (Windows) or Cmd+~ (macOS)

## Troubleshooting

**App won't start:**
- Make sure Node.js is installed: `node --version`
- Check dependencies: `npm list`
- Reinstall: `rm -rf node_modules && npm install`

**Windows not appearing:**
- Check for errors in the console
- Make sure HTML files exist in the same directory
- Check file paths in main.js

**IPC not working:**
- Verify preload.js is being loaded
- Check `contextBridge` exports in preload.js
- Verify `nodeIntegration: false` and `contextIsolation: true`

## Next Steps

- Customize the UI colors and styles
- Add more message box types
- Create additional window types
- Implement data persistence
- Add file operations functionality

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron API - BrowserWindow](https://www.electronjs.org/docs/api/browser-window)
- [Electron API - Dialog](https://www.electronjs.org/docs/api/dialog)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)

## License

MIT
