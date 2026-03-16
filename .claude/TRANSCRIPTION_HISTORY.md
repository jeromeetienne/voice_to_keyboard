# Transcription History Persistence

## Overview

The transcription history is now persisted to disk, allowing you to access your transcription history across application restarts.

## How It Works

### Storage Location
- **File location:** `.transcription_history.json` at the project root (hidden file)
- **Format:** JSON (human-readable and inspectable)
- **Max entries:** 100 (newest transcriptions kept, oldest removed when limit exceeded)

### Behavior

1. **On App Startup:**
   - The history file is automatically loaded from disk
   - If the file doesn't exist, the app starts with an empty history
   - File path is logged to console: `[ElectronMain] Transcription history loaded from: <path>`

2. **During Operation:**
   - Each transcription is immediately appended to the in-memory history
   - The history is automatically saved to disk after each transcription
   - If the history exceeds 100 entries, the oldest entry is removed

3. **History Window:**
   - Display shows all persisted transcriptions
   - Updates in real-time as new transcriptions are added
   - Clicking "History" in the menu opens the history window

### Technical Details

#### New Files Created
- **`src/libs/transcription_history.ts`** - `TranscriptionHistoryManager` class
  - Handles file I/O for history persistence
  - Manages history limits and ordering
  - Type-safe with TypeScript

#### Modified Files
- **`src/electron/electron_main.ts`**
  - Imports and initializes `TranscriptionHistoryManager`
  - Loads history on app startup
  - Passes manager to `HistoryWindowHelper`
  - Updated `appendTranscriptionToHistory()` to be async and save to disk

### API

#### TranscriptionHistoryManager

```typescript
// Create instance
const manager = new TranscriptionHistoryManager(
  maxEntries = 100,
  projectRoot = process.env.HOME  // defaults to home directory
);

// Load from disk
await manager.load();

// Add new transcription
await manager.append(text);

// Get all entries
const entries = manager.getAll();

// Clear all history
await manager.clear();

// Get file path (for debugging)
const filePath = manager.getFilePath();
```

### Configuration

To change the maximum number of entries, modify `MAX_HISTORY_ENTRIES` in `src/electron/electron_main.ts`:

```typescript
const MAX_HISTORY_ENTRIES = 100;  // Change this value
```

## Example JSON File

```json
[
  {
    "text": "Hello world",
    "createdAt": "2026-03-16T15:30:45.123Z"
  },
  {
    "text": "Voice to keyboard is working great",
    "createdAt": "2026-03-16T15:29:30.456Z"
  }
]
```

## Troubleshooting

### History not persisting?
- Check file permissions for the project directory
- Look at the console logs for error messages with `[TranscriptionHistoryManager]` prefix

### Lost history?
- The history file is a simple JSON file - you can manually restore from backups
- Clear history with the `clear()` method if needed

### Manually inspect history
- Open `.transcription_history.json` in any text editor (it's a hidden file)
- On macOS/Linux, use `cat .transcription_history.json` or `ls -la` to see hidden files
- The format is human-readable JSON with timestamp information

## Future Enhancements

Possible improvements:
- Export history to CSV/Excel
- Search/filter history
- Clear history older than N days
- History statistics (total transcriptions, etc.)
