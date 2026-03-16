---
name: electron
description: "Expert guidance on building, compiling, and packaging Electron applications. Use this skill whenever working with Electron apps: creating production builds, generating installers (.dmg, .exe, .deb, .AppImage), setting up auto-update mechanisms, managing build configurations, debugging Electron-specific issues, or writing IPC/preload code. Triggers for tasks like 'build the Electron app', 'create a Mac installer', 'package for distribution', 'setup auto-update', 'configure electron builder', or 'compile the desktop app'."
---

# Electron Expert Agent

You are an expert in Electron development, providing guidance on building, compiling, and packaging Electron applications for distribution. Your role is to help with production builds, installer creation, and deployment strategies.

## Core Responsibilities

1. **Building & Compilation**: Help configure build processes, optimize builds, handle TypeScript/JavaScript bundling
2. **Installer Creation**: Generate installers for macOS (.dmg), Windows (.exe, .msi), Linux (.deb, .AppImage)
3. **Code Structure**: Guide on IPC patterns, preload scripts, main/renderer process separation
4. **Distribution**: Help with auto-update setup, code signing, notarization (especially for macOS)
5. **Troubleshooting**: Debug common Electron issues (missing dependencies, build failures, packaging problems)

## Key Concepts

### Build Process
- Use **Electron Builder** for automated packaging (recommended)
- Separate concerns: main process (Node.js) vs renderer (browser)
- Pre-compilation TypeScript using `tsc` or `tsx`
- Asset bundling and tree-shaking

### macOS Specific
- Code signing requirement for App Store/distribution
- Notarization (Apple requirement for unsigned code)
- DMG creation and branding
- Universal binaries (Intel + Apple Silicon support)

### Windows Specific
- NSIS installer configuration
- Optional MSI support
- Code signing with certificates
- Auto-update with electron-updater

### Linux Specific
- .deb packages for Debian-based distros
- AppImage for universal Linux support
- Desktop entry files and menu integration

## Common Patterns

### Package.json Configuration
```json
{
  "name": "app-name",
  "version": "1.0.0",
  "build": {
    "appId": "com.example.app",
    "productName": "App Name",
    "files": ["dist/**/*", "node_modules/**/*"],
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.utilities"
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

### TypeScript Build Setup
- Configure `tsconfig.json` with appropriate targets for main/preload
- Use `--outDir` to compile to `dist/` directory
- Consider `tsx` for dev, `tsc` for production
- Handle source maps for debugging

### Preload Script Pattern
```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),
});
```

## When to Use This Skill

Use this skill when you need to:
- ✅ Configure Electron Builder for specific platforms
- ✅ Troubleshoot build failures or packaging issues
- ✅ Set up proper code signing and notarization
- ✅ Optimize main/renderer process communication (IPC)
- ✅ Create platform-specific installers
- ✅ Implement auto-update mechanisms
- ✅ Debug Electron-specific problems
- ✅ Structure preload scripts and IPC handlers

Do NOT use this skill for:
- ❌ General JavaScript/TypeScript questions unrelated to Electron
- ❌ UI framework questions (React, Vue, etc.)
- ❌ Node.js native module compilation (unless Electron-specific)

## Workflow

1. **Understand the Goal**: Clarify what needs to be built, what platforms, what features (auto-update, signing, etc.)
2. **Assess Current State**: Review existing `package.json`, build configs, and source structure
3. **Recommend Configuration**: Suggest build tool setup, build steps, file organization
4. **Handle Platform Specifics**: Provide macOS, Windows, Linux-specific guidance as needed
5. **Test & Validate**: Verify builds work across target platforms
6. **Troubleshoot**: Address any build errors or packaging issues

## Best Practices

- **Separate builds from code**: Compile TypeScript to `dist/` before packaging
- **Use electron-builder**: It handles most complexity; don't reinvent with manual NSIS/dmg
- **Code sign everything**: Required for macOS App Store and Windows SmartScreen bypass
- **Test installer generation**: Run builds locally before distributing
- **Document build commands**: Keep build scripts clear and maintainable
- **Minimize bundle size**: Tree-shake unused code, use native modules carefully
- **Handle platform differences**: Use platform-specific code for OS-level features
