# Electron Build Error Diagnosis: ENOENT - node_modules Not Found

## Problem Summary
You're experiencing an `ENOENT` (Error NO ENTry) error indicating that `node_modules` cannot be found during your Electron build process. This is a common issue that occurs when the build system cannot locate installed dependencies, even though they're listed in `package.json`.

## Root Causes

### 1. **Dependencies Not Installed**
**Most Common Cause**
- `npm install` or `yarn install` has never been run
- Dependencies were deleted or `node_modules/` was removed
- Installation failed silently (check for error messages)

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Or with yarn
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

### 2. **Build Step Missing `npm install`**
**Common in CI/CD or team workflows**
- Your build script doesn't run `npm install` before building
- Different machines/environments don't have dependencies pre-installed

**Solution - Update build script:**
```json
{
  "scripts": {
    "install": "npm install",
    "build": "npm install && tsc && electron-builder",
    "pack": "npm install && electron-builder --dir",
    "dist": "npm install && electron-builder"
  }
}
```

### 3. **Incorrect Working Directory**
**During build process**
- Build tool runs from wrong directory (not project root)
- Relative paths to `node_modules` fail
- Especially problematic with Electron Builder

**Solution - Verify your build configuration:**
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
    "directories": {
      "buildResources": "assets",
      "output": "out"
    }
  }
}
```

The `files` array must correctly reference `node_modules` relative to project root.

### 4. **Incomplete `files` Configuration in Electron Builder**
**Most likely culprit for ENOENT during packaging**
- The build config doesn't include `node_modules/**/*`
- Only compiled code is included, not dependencies
- Results in runtime errors when app tries to load modules

**Before (Broken):**
```json
{
  "build": {
    "files": ["dist/**/*"]
  }
}
```

**After (Fixed):**
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ]
  }
}
```

### 5. **TypeScript Compilation Not Completed**
**Before packaging**
- Build runs before TypeScript compiles to `dist/`
- References to compiled modules fail
- Source `.ts` files can't be loaded

**Solution - Check your build order:**
```json
{
  "scripts": {
    "prebuild": "tsc",
    "build": "electron-builder"
  }
}
```

Or explicitly in script:
```bash
npm run tsc && npm run build
```

### 6. **Platform-Specific Path Issues**
**Windows vs. Unix**
- Backslashes vs forward slashes in paths
- Case sensitivity differences
- Module resolution issues

**Solution:**
```typescript
// Use path module for cross-platform compatibility
import path from 'path';

const modulePath = path.join(__dirname, 'node_modules', 'modulename');
```

### 7. **Node Version Mismatch**
**Native modules compatibility**
- Different Node versions between development and build environment
- Native modules compiled for wrong architecture
- electron-builder using different Node than your app

**Solution:**
```bash
# Check your Node version
node --version

# Ensure consistency in .nvmrc or .node-version
echo "18.0.0" > .nvmrc

# Rebuild native modules for Electron
npm rebuild --runtime=electron --target=28.0.0
```

### 8. **Conditional Dependency Installation**
**Post-install scripts failing**
- A post-install hook fails, leaving partial installation
- `optionalDependencies` silently failing to install

**Solution:**
```bash
# Force rebuild after install
npm install --no-optional
npm rebuild

# Check what's actually installed
npm ls --depth=0
```

## Diagnostic Steps

### Step 1: Verify Installation
```bash
# Check if node_modules exists and contains files
ls -la node_modules/
du -sh node_modules/

# List installed packages
npm ls --depth=0
```

### Step 2: Review Build Configuration
```bash
# Check your package.json build section
cat package.json | grep -A 20 '"build"'

# If using electron-builder config file
cat electron-builder.json
```

### Step 3: Check Build Scripts
```bash
# Run your build command with verbose output
npm run build -- --verbose

# Or with electron-builder directly
npx electron-builder --help
```

### Step 4: Inspect Error Stack
```bash
# Get full error details
npm run build 2>&1 | tail -50

# Check what path it's trying to access
ls -la path/from/error/message
```

### Step 5: Verify TypeScript Output
```bash
# Check if dist/ directory exists and is populated
ls -la dist/

# If empty, TypeScript compilation failed
npm run tsc -- --listFiles
```

## Build Configuration Best Practices

### Recommended package.json Structure
```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "electron .",
    "build-ts": "tsc",
    "build": "npm run build-ts && electron-builder",
    "pack": "npm run build-ts && electron-builder --dir",
    "dist": "npm run build-ts && electron-builder",
    "prebuild": "npm install"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My App",
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "assets",
      "output": "out"
    },
    "mac": {
      "target": ["dmg"]
    },
    "win": {
      "target": ["nsis"]
    },
    "linux": {
      "target": ["AppImage"]
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json for Electron
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
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "out"]
}
```

## Quick Fix Checklist

- [ ] Run `npm install` or `yarn install` from project root
- [ ] Verify `node_modules/` directory exists and contains files
- [ ] Check `package.json` `build.files` includes `node_modules/**/*`
- [ ] Confirm TypeScript compiles to `dist/` before electron-builder runs
- [ ] Verify build scripts run in correct working directory
- [ ] Check for TypeScript errors with `npm run tsc`
- [ ] Rebuild native modules: `npm rebuild`
- [ ] Clear cache: `npm cache clean --force`
- [ ] Delete and reinstall: `rm -rf node_modules && npm install`
- [ ] Run with verbose output to see actual error path

## Next Steps

1. **Identify exact error line**: Run build with `--verbose` flag
2. **Check which module is missing**: Look at the full path in error
3. **Verify installation**: Run `npm ls modulename`
4. **Check file permissions**: Ensure `node_modules` is readable
5. **Test on clean environment**: Replicate error in fresh clone

## Prevention

- Always run `npm install` before building
- Include `npm install` in CI/CD pipeline before build step
- Add `node_modules` to `.gitignore` (not version control)
- Document build process clearly for team
- Use lock files (`package-lock.json`) for reproducible installs
- Test builds locally before committing configuration changes
