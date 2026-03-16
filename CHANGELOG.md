# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Transcription History Persistence**: Transcription history is now persisted to disk across application restarts
  - History is automatically loaded when the app starts
  - Each transcription is saved to `.transcription_history.json` in the project root
  - Maintains the most recent 100 transcriptions (configurable via `MAX_HISTORY_ENTRIES`)
  - New `TranscriptionHistoryManager` class in `src/libs/transcription_history.ts` handles file I/O and history management
  - History window continues to display all persisted transcriptions in real-time
  - Added comprehensive documentation in `.claude/TRANSCRIPTION_HISTORY.md`

### Changed

- `HistoryWindowHelper.appendTranscriptionToHistory()` is now async to support file persistence
- History is now managed by `TranscriptionHistoryManager` instead of in-memory only

## [1.0.2]

### Initial release

- Voice recording and transcription via whisper.cpp
- Global keyboard shortcut support
- Multiple transcription model options
- History window for viewing transcriptions
- Configuration window for settings
- Electron tray icon with status indicators
