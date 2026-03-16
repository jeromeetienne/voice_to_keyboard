# Packaging TypeScript Electron App for macOS Distribution

This guide covers the complete process of building, signing, and distributing an Electron application as a macOS .dmg installer.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Setup](#project-structure-setup)
3. [Dependencies and Configuration](#dependencies-and-configuration)
4. [Build Configuration](#build-configuration)
5. [Code Signing Setup](#code-signing-setup)
6. [Build and Packaging Process](#build-and-packaging-process)
7. [DMG Creation](#dmg-creation)
8. [Distribution and Notarization](#distribution-and-notarization)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v14+ (with npm or yarn)
- **Xcode**: Latest version (for code signing and build tools)
- **Electron**: v14+
- **electron-builder**: Latest version (for packaging)

### macOS Developer Account
- Apple Developer ID (for code signing)
- Code Signing Certificate (Developer ID Application Certificate)
- Valid App ID and provisioning profiles (optional, for App Store submission)

### Install Xcode Command Line Tools
```bash
xcode-select --install
```

---

## Project Structure Setup

Organize your project with the following structure:

```
your-app/
├── src/                      # TypeScript source files
│   ├── main.ts              # Main process
│   ├── preload.ts           # Preload script
│   └── renderer/
│       └── app.tsx          # Renderer process
├── dist/                    # Compiled output (generated)
├── build/                   # Build assets (icons, backgrounds for DMG)
│   ├── icon.icns            # macOS app icon (512x512+ recommended)
│   ├── dmg-background.png   # DMG background image
│   └── dmg-icon.icns        # DMG window icon
├── package.json
├── tsconfig.json
├── electron-builder.json    # Packaging configuration
└── webpack.config.js        # Or other build tool config
```

---

## Dependencies and Configuration

### 1. Install Required Packages

```bash
npm install --save-dev \
  electron \
  electron-builder \
  typescript \
  webpack \
  webpack-cli \
  ts-loader
```

For development:
```bash
npm install --save-dev \
  electron-reloader \
  concurrently
```

### 2. Update package.json

Add build scripts and configuration:

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "My TypeScript Electron App",
  "main": "dist/main.js",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "concurrently \"npm run watch\" \"wait-on http://localhost:3000 && electron .\"",
    "watch": "webpack --watch --config webpack.config.js",
    "build": "webpack --mode production --config webpack.config.js",
    "pack": "electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:mac:arm64": "npm run build && electron-builder --mac --arm64",
    "dist:mac:universal": "npm run build && electron-builder --mac -mwl"
  },
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "My App",
    "directories": {
      "buildResources": "build"
    },
    "mac": {
      "target": [
        "dmg",
        "zip"
      ],
      "category": "public.app-category.utilities",
      "icon": "build/icon.icns",
      "certificateFile": "cert.p12",
      "certificatePassword": "${APPLE_CERT_PASSWORD}",
      "identity": "Developer ID Application",
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "dmg": {
      "icon": "build/dmg-icon.icns",
      "background": "build/dmg-background.png",
      "iconSize": 100,
      "contents": [
        {
          "x": 110,
          "y": 150,
          "type": "file"
        },
        {
          "x": 240,
          "y": 150,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

### 3. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## Build Configuration

### 1. Webpack Configuration (webpack.config.js)

```javascript
const path = require('path');

module.exports = [
  // Main process
  {
    mode: 'production',
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  // Preload script
  {
    mode: 'production',
    entry: './src/preload.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js'
    },
    target: 'electron-preload',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  }
];
```

### 2. TypeScript Entry Points

**src/main.ts:**
```typescript
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
```

**src/preload.ts:**
```typescript
import { contextBridge, ipcMain } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Expose safe APIs here
  getAppVersion: () => process.env.npm_package_version
});
```

---

## Code Signing Setup

### 1. Obtain Code Signing Certificate

1. Visit [Apple Developer](https://developer.apple.com)
2. Go to Certificates, Identifiers & Profiles
3. Create or download your "Developer ID Application" certificate
4. Export as .p12 file with a password

### 2. Create Entitlements Files

**build/entitlements.mac.plist:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
</dict>
</plist>
```

### 3. Environment Variables

Create a `.env` file (do NOT commit to version control):
```
APPLE_CERT_PASSWORD=your_certificate_password
APPLE_TEAM_ID=your_team_id
```

Or set directly when building:
```bash
export APPLE_CERT_PASSWORD="your_password"
```

---

## Build and Packaging Process

### 1. Compile TypeScript

```bash
npm run build
```

This runs webpack to compile TypeScript to JavaScript in the `dist/` directory.

### 2. Prepare Icons and Assets

**macOS Icon (icon.icns):**
- Dimensions: 512x512 pixels minimum
- Format: ICNS (Apple Icon Image format)
- Use tools like ImageMagick or online converters
- Place in `build/` directory

**Create from PNG:**
```bash
# Using sips (macOS built-in)
mkdir -p build/icon.iconset
sips -z 16 16 build/icon.png --out build/icon.iconset/icon_16x16.png
sips -z 32 32 build/icon.png --out build/icon.iconset/icon_32x32.png
sips -z 64 64 build/icon.png --out build/icon.iconset/icon_64x64.png
sips -z 128 128 build/icon.png --out build/icon.iconset/icon_128x128.png
sips -z 256 256 build/icon.png --out build/icon.iconset/icon_256x256.png
sips -z 512 512 build/icon.png --out build/icon.iconset/icon_512x512.png
iconutil -c icns build/icon.iconset -o build/icon.icns
rm -rf build/icon.iconset
```

### 3. Build and Create DMG

```bash
npm run dist:mac
```

This will:
1. Compile TypeScript files
2. Run electron-builder
3. Create a signed .dmg installer
4. Output to `dist/` directory

For ARM64 (Apple Silicon):
```bash
npm run dist:mac:arm64
```

For Universal (Intel + Apple Silicon):
```bash
npm run dist:mac:universal
```

---

## DMG Creation Details

electron-builder automatically creates the DMG with:

1. **Background Image**: Placed at coordinates specified in electron-builder config
2. **Icon Layout**: Main app icon and Applications folder shortcut
3. **Signature**: Code signing certificate applied
4. **License**: Optional license agreement during installation

### Custom DMG Configuration

Update `electron-builder.json` or `package.json` build section:

```json
{
  "dmg": {
    "icon": "build/dmg-icon.icns",
    "background": "build/dmg-background.png",
    "iconSize": 100,
    "window": {
      "width": 540,
      "height": 380
    },
    "contents": [
      {
        "x": 110,
        "y": 150,
        "type": "file"
      },
      {
        "x": 240,
        "y": 150,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
```

---

## Distribution and Notarization

### 1. Apple Notarization (Required for macOS 10.15+)

Notarization ensures your app passes Apple's security checks.

**Setup in package.json:**
```json
{
  "build": {
    "mac": {
      "notarize": {
        "teamId": "${APPLE_TEAM_ID}"
      }
    }
  }
}
```

**Environment Variables:**
```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

**Note**: Use an app-specific password from Apple Account settings, not your main password.

### 2. Build with Notarization

```bash
APPLE_ID="your-id@example.com" \
APPLE_PASSWORD="your-password" \
APPLE_TEAM_ID="your-team-id" \
npm run dist:mac
```

### 3. Verify Notarization

```bash
# Check notarization status
spctl -a -v --type install "path/to/app.dmg"

# Staple notarization ticket (newer Electron versions do this automatically)
xcrun stapler staple "dist/My App-1.0.0.dmg"
```

---

## Complete electron-builder.json Example

```json
{
  "appId": "com.example.myapp",
  "productName": "My Electron App",
  "directories": {
    "buildResources": "build",
    "output": "dist"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "mac": {
    "target": [
      "dmg",
      "zip"
    ],
    "category": "public.app-category.utilities",
    "icon": "build/icon.icns",
    "certificateFile": "cert.p12",
    "certificatePassword": "${APPLE_CERT_PASSWORD}",
    "identity": "Developer ID Application",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "notarize": {
      "teamId": "${APPLE_TEAM_ID}"
    }
  },
  "dmg": {
    "icon": "build/dmg-icon.icns",
    "background": "build/dmg-background.png",
    "iconSize": 100,
    "window": {
      "width": 540,
      "height": 380
    },
    "contents": [
      {
        "x": 110,
        "y": 150,
        "type": "file"
      },
      {
        "x": 240,
        "y": 150,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
```

---

## Build Checklist

- [ ] TypeScript code compiles without errors
- [ ] Webpack configuration properly bundles main and renderer processes
- [ ] App icon created as `.icns` file (512x512+)
- [ ] DMG background image prepared (1024x768+ recommended)
- [ ] Code signing certificate obtained and stored securely
- [ ] Entitlements.plist configured with necessary permissions
- [ ] electron-builder configuration complete
- [ ] Environment variables set (certificate password, Apple ID)
- [ ] Test build with `npm run dist:mac`
- [ ] Verify code signature: `codesign -v --deep path/to/app.app`
- [ ] Run notarization check
- [ ] Test DMG installation on clean macOS environment

---

## Troubleshooting

### Code Signing Errors

**"Certificate not found"**
- Verify certificate is installed: `security find-identity -v -p codesigning`
- Ensure correct identity name in electron-builder config
- Check certificate password is correct

**"identity not found"**
```bash
# List available identities
security find-identity -v -p codesigning
```

### Notarization Failures

**"The software needs to be updated"**
- App contains code that doesn't meet Apple's security requirements
- Ensure all entitlements are properly configured
- Update Electron to latest version

**"Timeout waiting for notarization"**
- Increase timeout in electron-builder config
- Verify Apple ID credentials and team ID
- Check internet connection

### Build Issues

**"Cannot find module"**
- Verify all imports use correct paths
- Ensure TypeScript compilation succeeds independently
- Check webpack configuration includes all necessary loaders

**"App won't launch after installation"**
- Verify main.js path in package.json
- Check preload script path exists
- Review logs: `~/Library/Logs/myapp/`

### DMG Issues

**"Background image not showing"**
- Image must be PNG or TIFF format
- Verify path in electron-builder config is correct
- Dimensions should be at least 1024x768

**"App shortcut not draggable to Applications"**
- Ensure DMG contents have proper x,y coordinates
- Test DMG mounting and installation manually

---

## Security Best Practices

1. **Never commit secrets**: Use environment variables for passwords
2. **Restrict entitlements**: Only grant necessary permissions
3. **Keep dependencies updated**: Regularly update Electron and packages
4. **Enable hardened runtime**: Protect against code injection
5. **Use code signing**: Always sign for distribution
6. **Test on clean systems**: Verify installation works on fresh macOS
7. **Implement auto-updates**: Use electron-updater for security patches
8. **Sign updates**: Ensure update packages are also signed

---

## Additional Resources

- [Electron Security Documentation](https://www.electronjs.org/docs/tutorial/security)
- [electron-builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [macOS Notarization Guide](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution)

---

## Version Info

- Electron: 27.0+
- electron-builder: 24.6.4+
- Node.js: 16+
- macOS: 10.13+
- Xcode: 13+
