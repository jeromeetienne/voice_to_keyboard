# Source Code Diagnosis

Date: 2026-03-25

## Critical Issues

### 1. App gets permanently stuck on error
**File:** `src/app/voice2key_app.ts` lines 79-131

The `onStop` handler sets `appState = 'processing'` at line 86, but if anything throws (transcription failure, file write error, etc.), the `.catch()` at line 128 only logs — it never resets `appState` back to `'idle'`. The app becomes permanently stuck and won't respond to the hotkey anymore.

Similarly, if `micRecorder.stopRecording()` rejects at line 95, the early `return` at line 97 also leaves state stuck at `'processing'`.

### 2. Unhandled promise rejection in Electron startup
**File:** `src/electron/electron_main.ts` line 345

```ts
Electron.app.whenReady().then(async () => { ... });
```

If the async callback throws, this is an unhandled promise rejection (no `.catch()`). Could silently crash the app on startup.

## Moderate Issues

### 3. No validation on IPC config input
**File:** `src/electron/electron_main.ts` line 222

The `SAVE_CONFIG` handler passes renderer-supplied `appConfig` directly to `save()` with zero validation. A malicious or buggy renderer could write arbitrary JSON to disk. Zod is available in the project and should be used here.

### 4. `ConfigWindowHelper.appConfigManager` typed as `any`
**File:** `src/electron/electron_main.ts` line 93

Loses all type safety. Should be `AppConfigManager | null`.

### 5. Redundant whisper installation check
**Files:** `src/app/voice2key_app.ts` line 36 + `src/libs/transcription_whisper.ts` line 46

`Voice2KbdApp.main()` calls `installIfNeeded()`, then `TranscriptionWhisper.transcribe()` calls it again internally. Double work on every transcription.

### 6. Missing `sandbox: true` on BrowserWindows
**File:** `src/electron/electron_main.ts` lines 119-128

Config window, history window, and dummy window all lack `sandbox: true`. While `contextIsolation` and `nodeIntegration: false` are set (good), `sandbox: true` adds an extra security layer by restricting renderer process system access.

## Minor Issues

### 7. `Assert.ok` in production path
**File:** `src/app/voice2key_app.ts` line 101

Using `Assert.ok` will throw an unhandled `AssertionError` and crash the process rather than recovering gracefully.

### 8. `MicRecorder.soundPath` never rotated
**File:** `src/libs/mic_recorder.ts` line 17

The temp file path is set once in the constructor. Works because the file is deleted after each recording, but if deletion fails, the next recording silently overwrites the old file.
