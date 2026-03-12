# voice_to_keyboard

Turn held speech into typed text using a global hotkey on macOS.

When you hold Cmd+Shift+R, the app records microphone audio. When you release the keys, it stops recording, transcribes with whisper.cpp, and types the result into the currently focused app.

## Features

- Push-to-talk style recording with a global shortcut (Cmd+Shift+R)
- Local speech-to-text using whisper.cpp via @remotion/install-whisper-cpp
- Automatic typing of transcribed text via robotjs
- Minimal TypeScript codebase with focused modules

## Requirements

- macOS (project currently uses iohook-macos)
- Node.js 20+ recommended
- Homebrew
- SoX (provides rec command)
- Accessibility permission for global keyboard hooks and synthetic typing
- Microphone permission for audio recording

Install system dependency:

```bash
brew install sox
```

## Install

```bash
npm install
```

First run will also:

1. Install whisper.cpp binaries into outputs/whisper.cpp
2. Download the configured model (default: medium.en)

This first-time setup can take a while depending on network and machine speed.

## Run

```bash
npm run dev
```

Usage flow:

1. Focus any text input field in any app.
2. Hold Cmd+Shift+R to start recording.
3. Speak.
4. Release Cmd+Shift+R to stop recording.
5. Wait for transcription; text is typed automatically.

## Permissions (macOS)

You must grant permissions to the terminal app or app host running Node.js.

- Accessibility: required for global key monitoring and keyboard typing
- Microphone: required for rec (SoX) capture

If hotkeys do not trigger or typing does not happen, re-check Accessibility permission first.

## Scripts

- npm run dev: run the main app (src/bin/index.ts)
- npm run typecheck: TypeScript check only

## Project Structure

- src/bin/index.ts: app entrypoint and state machine (idle -> recording -> processing)
- src/libs/iobinding_helper.ts: global hotkey listener (Cmd+Shift+R)
- src/libs/mic_recorder.ts: microphone recording wrapper around rec
- src/libs/transcription_whisper.ts: whisper.cpp install and transcription helper
- src/libs/key_typing_helper.ts: text injection with robotjs
- examples/: small standalone experiments for iohook/robotjs/recording
- test_assets/test_sound.wav: sample audio for transcription mini-test
- outputs/whisper.cpp/: local whisper.cpp installation and model files

## How It Works

1. Startup calls TranscriptionWhisper.installIfNeeded().
2. A global keyDown for Cmd+Shift+R calls recorder.startRecording().
3. Matching keyUp calls recorder.stopRecording().
4. Recorded WAV is transcribed with whisper.cpp.
5. Final text is typed into the focused application.

## Development Notes

- The hotkey is hardcoded to Cmd+Shift+R in iobinding_helper.
- Transcription language defaults to en in src/bin/index.ts.
- Model defaults to medium.en; you can change modelName in src/bin/index.ts.
- Audio is captured as 16kHz mono WAV to match whisper.cpp expectations.

## Troubleshooting

### rec: command not found

Install SoX:

```bash
brew install sox
```

### No hotkey events

- Confirm macOS Accessibility permission for the running terminal app.
- Restart the terminal app after granting permission.

### Recording fails or is empty

- Confirm Microphone permission for the running terminal app.
- Test your microphone input with another app.

### First transcription is very slow

Expected on first run due to whisper.cpp install/model download.

### robotjs build/install issues

robotjs uses native bindings. If install fails, ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

Then reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## License

MIT
