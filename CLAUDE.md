# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install           # Install deps (also downloads whisper.cpp on first run)
npm run dev:terminal  # Run in terminal mode
npm run dev:electron  # Run as Electron tray app
npm run typecheck     # TypeScript type checking (no test framework present)
```

System dependency: `brew install sox` (required for audio recording).

## Architecture

**Voice to Keyboard** is a macOS push-to-talk app: hold Cmd+Option+] to record, release to transcribe via whisper.cpp, then auto-type the result into the focused window.

### State Machine

The core is `src/app/voice2key_app.ts` — a three-state machine:
- `idle` → `recording` (hotkey down) → `processing` (hotkey up) → `idle`

Two launchers share this core: `src/bin/launcher_terminal.ts` (simple) and `src/bin/launcher_electron.ts` → `src/electron/electron_main.ts` (tray app with windows).

### Key Libraries (`src/libs/`)

| File | Role |
|------|------|
| `global_shortcut.ts` | Wraps `iohook-macos`; hotkey hardcoded to Cmd+Option+] (keyCode 30) |
| `mic_recorder.ts` | Spawns SoX `rec` at 16kHz mono 16-bit PCM (whisper requirement) |
| `transcription_whisper.ts` | Installs whisper.cpp v1.5.5 + model on first run; wraps `@remotion/install-whisper-cpp` |
| `keyboard_typer.ts` | Injects text via `robotjs.typeString()` |
| `app_config.ts` | Loads/saves `outputs/appconfig.json` with Zod validation |
| `transcription_history.ts` | Persists history to `.transcription_history.json`, max 100 entries |

### Electron UI (`src/electron/electron_main.ts`)

Creates three windows: a hidden dummy window for IPC, a config window (`public/config-window/`), and a history window (`public/history-window/`). Tray icon cycles through three PNGs in `assets/images/` to reflect app state.

### Configuration

Stored in `outputs/appconfig.json`:
```json
{ "transcriptionLanguage": "en", "transcriptionModel": "medium.en" }
```
12 model variants and 20+ languages are supported (see `app_config.ts`).

### macOS Permissions Required

- **Accessibility** — global keyboard hooks + synthetic typing
- **Microphone** — audio recording

TypeScript is CommonJS (`tsconfig.json` targets ES2018, no emit — `tsx` runs source directly).
