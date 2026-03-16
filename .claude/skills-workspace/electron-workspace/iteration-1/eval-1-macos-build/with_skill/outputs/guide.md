# Complete Guide: Packaging TypeScript Electron App for macOS Distribution

This guide provides step-by-step instructions for packaging your TypeScript Electron application for macOS distribution with code signing and DMG installer creation, based on Electron best practices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Verification](#project-structure-verification)
3. [TypeScript Build Configuration](#typescript-build-configuration)
4. [Package.json Setup](#packagejson-setup)
5. [Code Signing Preparation](#code-signing-preparation)
6. [Build Process](#build-process)
7. [Distribution & Notarization](#distribution--notarization)
8. [Testing](#testing)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js & npm**: v14 or higher
- **Electron**: v11 or higher
- **electron-builder**: Latest version
- **macOS Developer Certificate**: From Apple Developer Account
- **Xcode Command Line Tools**: `xcode-select --install`

### Install Required Dependencies

```bash
npm install --save-dev electron electron-builder
npm install --save-dev typescript ts-node
```

If you're using React or another UI framework:
```bash
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
```

---

## Project Structure Verification

Verify your project structure matches expected layout:

```
your-app/
├── src/
│   ├── main.ts                 # Main process (Node.js)
│   ├── preload.ts             # Preload script (optional but recommended)
│   ├── renderer/              # Renderer process (browser)
│   │   ├── App.tsx            # Main React component
│   │   └── index.tsx          # Entry point
│   └── types.ts               # TypeScript definitions
├── dist/                       # Compiled output (created during build)
├── package.json
├── tsconfig.json
└── electron-builder.yml       # Build configuration (we'll create this)
```

---

## TypeScript Build Configuration

### Step 1: Update tsconfig.json

Create or update your `tsconfig.json` with proper Electron settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key settings explained:**
- `target: "ES2020"`: Modern JavaScript support for Electron v13+
- `module: "commonjs"`: Required for Node.js main process
- `outDir: "./dist"`: Compiled files go to dist folder
- `sourceMap: true`: Enable debugging in DevTools
- `declaration: true`: Generate .d.ts files for type safety

### Step 2: Create Build Scripts in package.json

Add these build scripts (covered in next section, but prepare for this):

```json
{
  "scripts": {
    "build:ts": "tsc",
    "build:app": "npm run build:ts && electron-builder",
    "build:dmg": "npm run build:ts && electron-builder -m dmg",
    "build:prod": "npm run build:ts && electron-builder --publish=never",
    "dev": "ts-node src/main.ts"
  }
}
```

---

## Package.json Setup

### Step 3: Configure electron-builder

Add build configuration to your `package.json`:

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "My TypeScript Electron Application",
  "main": "dist/main.js",
  "homepage": "./",
  "author": "Your Name",
  "license": "MIT",

  "build": {
    "appId": "com.example.myapp",
    "productName": "My Electron App",
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.utilities",
      "icon": "assets/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "assets/entitlements.mac.plist",
      "entitlementsInherit": "assets/entitlements.mac.plist"
    }
  }
}
```

**Configuration explained:**
- `appId`: Unique identifier (reverse domain notation)
- `productName`: Display name in macOS
- `files`: What to include in distribution (compiled code + node_modules)
- `target`: DMG for installer, ZIP for portable version
- `hardenedRuntime`: Required for notarization
- `entitlements`: Permissions required by your app

---

## Code Signing Preparation

### Step 4: Obtain Apple Developer Certificate

1. **Log in to Apple Developer Portal** (https://developer.apple.com)
2. **Create/Use signing certificate**:
   - Go to "Certificates, Identifiers & Profiles"
   - Create "Developer ID Application" certificate (for distribution)
   - Download the certificate (`.cer` file)

3. **Install in Keychain**:
   - Double-click the downloaded certificate
   - It auto-imports to your Keychain

4. **Verify installation**:
   ```bash
   security find-identity -v -p codesigning
   ```
   Look for your "Developer ID Application" certificate.

### Step 5: Create Entitlements Files

Create `assets/entitlements.mac.plist` for code signing:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
```

**Adjust based on your app's needs:**
- **JIT**: Required for V8 engine (always include)
- **Unsigned memory**: Required for JavaScript execution
- **Library validation**: Some native modules need this disabled

### Step 6: Create App Icon

Electron requires macOS `.icns` format for icons:

```bash
# Create icon from PNG (1024x1024 recommended)
npm install --save-dev icongen-cli
npx icongen-cli input.png -o assets/icon.icns
```

Or use an online converter if you don't have a 1024x1024 PNG.

---

## Build Process

### Step 7: Compile TypeScript

First, compile your TypeScript to JavaScript:

```bash
npm run build:ts
# or directly:
tsc
```

This creates the `dist/` folder with compiled JavaScript files matching your `src/` structure.

### Step 8: Build DMG Installer

Build the DMG installer with code signing:

```bash
npm run build:dmg
# This runs: tsc && electron-builder -m dmg
```

**What happens:**
1. TypeScript compiles to `dist/`
2. electron-builder packages your app
3. Looks for signing certificate in Keychain
4. Creates `.dmg` file in `dist/` directory
5. Signs the app bundle automatically

### Step 9: Verify Build Output

Check the output:

```bash
ls -la dist/
# You should see:
# - My Electron App-1.0.0.dmg
# - My Electron App-1.0.0.zip (if included in targets)
# - My Electron App.app (the app bundle)
```

### Complete Build Example

Here's a full workflow example:

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npm run build:ts

# 3. Verify dist folder created
ls dist/

# 4. Build DMG (signs and creates installer)
npm run build:dmg

# 5. Check output
ls -lh dist/*.dmg
file dist/My\ Electron\ App.app
```

---

## Distribution & Notarization

### Step 10: Apple Notarization (Required for macOS 10.15+)

Notarization verifies your app is free of malware before users can run it.

#### Create Notarization Credentials

1. **Generate App-Specific Password** at https://appleid.apple.com
2. **Store in Keychain**:
   ```bash
   xcrun notarytool store-credentials "Apple Developer"
   # When prompted:
   # - Apple ID: your@apple.com
   # - App-Specific Password: (paste the generated password)
   ```

#### Add to Build Configuration

Update `package.json` build config:

```json
{
  "build": {
    "mac": {
      "notarize": {
        "teamId": "ABCD123456",
        "appleId": "your@apple.com",
        "appleIdPassword": "@keychain:Apple Developer"
      }
    }
  }
}
```

Or use environment variables:

```bash
export APPLE_ID=your@apple.com
export APPLE_ID_PASSWORD=@keychain:Apple Developer
export APPLE_TEAM_ID=ABCD123456
npm run build:dmg
```

**Get your Team ID:**
```bash
# From Apple Developer Portal
# Or run:
xcrun altool --list-providers
```

#### Build with Notarization

```bash
npm run build:dmg
# electron-builder automatically:
# 1. Signs the app
# 2. Submits to Apple for notarization
# 3. Waits for approval
# 4. Staples notarization ticket
```

### Step 11: Verify Code Signing

After build, verify everything is signed:

```bash
# Check app is signed
codesign -dv --verbose=2 dist/My\ Electron\ App.app

# Check signature is valid
spctl -a -vvv -t install dist/My\ Electron\ App.app
```

Expected output should show the app is "accepted" and matches your developer certificate.

---

## Testing

### Step 12: Manual Testing

1. **Mount and test DMG**:
   ```bash
   open dist/My\ Electron\ App-1.0.0.dmg
   # Drag app to Applications folder
   # Launch from Launchpad
   ```

2. **Check notarization status**:
   ```bash
   spctl -a -v "dist/My Electron App.app"
   # Should show: "accepted"
   ```

3. **Verify on another Mac** (if possible) to ensure notarization worked

### Step 13: Distribution

**For App Store:**
- Use "Mac App Store" certificate instead
- Add App Store-specific entitlements
- Submit through Transporter app

**For Direct Distribution:**
- Host `.dmg` or `.zip` on your server
- Include SHA256 hash for verification
- Consider auto-update with electron-updater

Example auto-update setup (optional):

```bash
npm install electron-updater
```

```typescript
// In main.ts
import { autoUpdater } from "electron-updater";

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## Troubleshooting

### Build Fails: "Cannot find module 'dist/main.js'"

**Solution:** Run `tsc` before electron-builder:
```bash
npm run build:ts
npm run build:dmg
```

### Signing Error: "Certificate not found"

**Solution:** Verify certificate in Keychain:
```bash
security find-identity -v -p codesigning
# If not listed, download and install from Apple Developer Portal
```

### Notarization Fails

**Solution:** Check logs:
```bash
xcrun notarytool log <notarization-id> --team-id <TEAM_ID>
```

Common issues:
- Unsigned binaries in bundle (check node_modules)
- Missing entitlements
- Expired credentials

### DMG Won't Mount

**Solution:** Rebuild and verify:
```bash
rm dist/My\ Electron\ App-1.0.0.dmg
npm run build:dmg
```

---

## Summary Checklist

- [ ] TypeScript configured with proper targets
- [ ] `dist/` folder in .gitignore
- [ ] package.json has build configuration
- [ ] Apple Developer Certificate installed in Keychain
- [ ] Icon in `.icns` format at `assets/icon.icns`
- [ ] Entitlements file at `assets/entitlements.mac.plist`
- [ ] Build scripts in package.json
- [ ] Run `npm run build:ts` successfully
- [ ] Run `npm run build:dmg` successfully
- [ ] DMG mounts and app launches
- [ ] Code signature verified with `codesign -dv`
- [ ] Notarization completed (if distributing via App Store or widely)
- [ ] Tested on another macOS machine

---

## Quick Reference Commands

```bash
# Build commands
npm run build:ts              # Compile TypeScript only
npm run build:dmg             # Build DMG with signing
npm run build:prod            # Build without publishing

# Verification commands
codesign -dv --verbose=2 dist/My\ Electron\ App.app
spctl -a -v "dist/My Electron App.app"
security find-identity -v -p codesigning

# Notarization commands
xcrun notarytool store-credentials "Apple Developer"
xcrun notarytool log <id> --team-id <TEAM_ID>
```

---

## References

- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [electron-builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarization Overview](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

