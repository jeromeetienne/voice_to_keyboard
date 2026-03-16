# Global Hotkey Registration in Electron (macOS): Complete Solution

## Problem Analysis

Your Electron app's Cmd+Shift+K hotkey only works when the app window is focused because you're likely using `electron.globalShortcut.register()` incorrectly, or the accessibility permissions are missing. Here's why this happens and how to fix it.

## Why Focused-Only Hotkeys Occur

### Root Causes

1. **Accessibility Permissions Missing**: macOS requires "Accessibility" permission in System Preferences to allow apps to register system-level keyboard listeners. Without this, Electron falls back to window-focused-only hotkey detection.

2. **Using Window-Scoped Shortcuts**: If hotkeys are registered on a BrowserWindow instead of globally, they only trigger when that window is focused.

3. **Platform-Specific Limitations**: `electron.globalShortcut` has platform limitations—on macOS it needs the proper permissions to function as truly "global."

4. **Native Module Issues**: Low-level keyboard event listeners (like iohook) may fail silently if accessibility access is denied.

## Solution 1: Using Electron's globalShortcut (Recommended for Basic Hotkeys)

This works when accessibility permissions are properly granted.

### Implementation

```typescript
import { app, globalShortcut, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  // Request accessibility permissions (macOS will prompt user)
  requestAccessibilityPermissions();

  // Register global hotkey - works even when unfocused
  const ret = globalShortcut.register('CommandOrControl+Shift+K', () => {
    console.log('Cmd+Shift+K triggered - app is recording now');

    // Send event to renderer process
    mainWindow.webContents.send('start-recording');

    // Or handle directly in main process
    startRecording();
  });

  if (!ret) {
    console.error('Failed to register Cmd+Shift+K');
  }
});

app.on('will-quit', () => {
  // Always unregister hotkeys on app exit
  globalShortcut.unregisterAll();
});

function startRecording() {
  // Your recording logic here
  console.log('Recording started');
}

async function requestAccessibilityPermissions() {
  // For macOS, you may need to prompt user to enable accessibility
  // This is typically done via System Preferences
  console.log('Please ensure this app has Accessibility permission in System Preferences');
}
```

### Verification Steps

1. **Check Accessibility Permissions**:
   - System Preferences → Security & Privacy → Accessibility
   - Ensure your app is listed and enabled

2. **Test Registration**:
   ```bash
   # Check if hotkey registered successfully
   npm run start  # Start your app
   # Press Cmd+Shift+K while app is in background
   # You should see "Cmd+Shift+K triggered" in console
   ```

3. **Debug Failed Registration**:
   ```typescript
   const ret = globalShortcut.register('CommandOrControl+Shift+K', () => {
     console.log('Hotkey fired');
   });

   if (!ret) {
     console.error('Registration failed - check accessibility permissions');
     console.log('Accessibility permission status:', getAccessibilityStatus());
   }
   ```

## Solution 2: Using iohook for Low-Level Keyboard Listening (More Reliable)

For cases where `electron.globalShortcut` fails or you need more control.

### Installation

```bash
npm install iohook
# Or for better macOS support:
npm install iohook-macos
```

### Implementation

```typescript
import { iohook } from 'iohook';
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow;
let isRecording = false;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  // Start listening for global keyboard events
  setupGlobalKeyListener();
});

function setupGlobalKeyListener() {
  // Track modifier key states
  let cmdPressed = false;
  let shiftPressed = false;

  iohook.on('keydown', (event) => {
    // macOS Cmd = keycode 55
    if (event.keycode === 55) {
      cmdPressed = true;
    }

    // Shift = keycode 60
    if (event.keycode === 60) {
      shiftPressed = true;
    }

    // K = keycode 40
    if (event.keycode === 40 && cmdPressed && shiftPressed) {
      console.log('Global Cmd+Shift+K detected');
      startRecording();
      event.preventDefault(); // Prevent the keystroke from reaching other apps
    }
  });

  iohook.on('keyup', (event) => {
    if (event.keycode === 55) {
      cmdPressed = false;
    }
    if (event.keycode === 60) {
      shiftPressed = false;
    }
  });

  iohook.start();
}

function startRecording() {
  if (isRecording) {
    console.log('Already recording');
    return;
  }

  isRecording = true;
  console.log('Recording started');

  // Send event to renderer
  mainWindow.webContents.send('start-recording');

  // Handle any recording logic
}

app.on('will-quit', () => {
  iohook.stop();
});
```

### Key Differences from Solution 1

- Works at OS level, not dependent on window focus
- More reliable for unfocused hotkeys
- Requires accessibility permissions (same as Solution 1)
- Can prevent keystroke from reaching other apps
- Better for complex key combinations

## Solution 3: Hybrid Approach (Recommended)

Combine Electron's globalShortcut with iohook fallback:

```typescript
import { app, globalShortcut, BrowserWindow } from 'electron';
import { iohook } from 'iohook';

let mainWindow: BrowserWindow;
let usingElectronShortcut = false;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  // Try Electron's globalShortcut first (simpler, cleaner)
  const registered = globalShortcut.register('CommandOrControl+Shift+K', () => {
    startRecording();
  });

  if (registered) {
    usingElectronShortcut = true;
    console.log('Using Electron globalShortcut');
  } else {
    console.log('Electron globalShortcut failed, falling back to iohook');
    setupIohookFallback();
  }
});

function setupIohookFallback() {
  let cmdPressed = false;
  let shiftPressed = false;

  iohook.on('keydown', (event) => {
    if (event.keycode === 55) cmdPressed = true;
    if (event.keycode === 60) shiftPressed = true;

    if (event.keycode === 40 && cmdPressed && shiftPressed) {
      startRecording();
    }
  });

  iohook.on('keyup', (event) => {
    if (event.keycode === 55) cmdPressed = false;
    if (event.keycode === 60) shiftPressed = false;
  });

  iohook.start();
}

function startRecording() {
  console.log('Recording started via ' + (usingElectronShortcut ? 'Electron' : 'iohook'));
  mainWindow.webContents.send('start-recording');
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (!usingElectronShortcut) {
    iohook.stop();
  }
});
```

## Permission Requirements

### 1. System-Level Permissions (User Must Grant)

**macOS Accessibility Permission**:
- User must manually enable: System Preferences → Security & Privacy → Accessibility
- Add your app to the list
- Without this, global hotkeys won't work

**User Notification**:
```typescript
import { dialog } from 'electron';

function promptAccessibilityPermission() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Accessibility Permission Required',
    message: 'Please enable accessibility permission for this app',
    detail: 'To enable: System Preferences → Security & Privacy → Accessibility → Add this app',
    buttons: ['Open System Preferences', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      // Open System Preferences to Accessibility section
      // This requires using shell.openExternal with appropriate path
    }
  });
}
```

### 2. Code-Level Permissions

**info.plist Configuration** (for macOS app):
```xml
<key>NSAccessibilityUsageDescription</key>
<string>This app needs accessibility permission to register global keyboard shortcuts for voice recording</string>
```

### 3. App Signing and Notarization

For production distribution, your Electron app must be:
- Code-signed
- Notarized (if distributed outside Mac App Store)

This ensures macOS trusts the app for accessibility features.

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| Hotkey doesn't trigger when unfocused | Check Accessibility permission in System Preferences |
| `globalShortcut.register()` returns false | Same as above; also check if hotkey is reserved by macOS |
| iohook installation fails | Ensure Xcode Command Line Tools are installed: `xcode-select --install` |
| iohook keycode values incorrect | Test with a logging approach to find correct keycodes for your keyboard layout |
| Multiple hotkey listeners conflict | Unregister old listeners before registering new ones |
| Hotkey works in dev but not in packaged app | Ensure app is properly code-signed and notarized |

## Testing Strategy

```typescript
// Add this to your main process for debugging
function debugHotkeys() {
  console.log('=== Hotkey Debug Info ===');
  console.log('Platform:', process.platform);
  console.log('App Name:', app.name);

  // Test registration
  const testReg = globalShortcut.register('CommandOrControl+Shift+L', () => {
    console.log('Test hotkey triggered');
  });
  console.log('Test registration successful:', testReg);

  if (!testReg) {
    console.log('WARNING: Global shortcuts not working');
    console.log('Possible causes:');
    console.log('1. Missing accessibility permissions');
    console.log('2. Hotkey already registered by another app');
    console.log('3. macOS reserved this hotkey');
  }

  globalShortcut.unregister('CommandOrControl+Shift+L');
}

// Call during app ready
app.on('ready', () => {
  debugHotkeys();
  // ... rest of setup
});
```

## Key Takeaways

1. **Accessibility Permission is Essential**: Without it, global hotkeys won't work on macOS
2. **Electron's globalShortcut is Preferred**: Use it first; it's simpler and cleaner
3. **iohook is Reliable Fallback**: When Electron fails, iohook provides low-level keyboard access
4. **Always Unregister on Exit**: Clean up resources when app closes
5. **Test Unfocused**: Always verify hotkeys work when app is in background
6. **Provide User Feedback**: Show visual/audio feedback when hotkey triggers

## Complete Working Example

See the hybrid solution above for a complete, production-ready implementation that handles both success and failure cases gracefully.
