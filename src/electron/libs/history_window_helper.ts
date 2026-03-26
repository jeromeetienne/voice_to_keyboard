import Path from 'node:path';

import Electron from 'electron';
import { TranscriptionHistoryManager, TranscriptionHistoryEntry } from '../../libs/transcription_history';
import { IPC_CHANNELS } from './ipc_channels';
import { ProjectPath } from './project_path';

export class HistoryWindowHelper {
	// Transcription history manager (handles file persistence)
	private static historyManager: TranscriptionHistoryManager | null = null;
	private static historyWindow: Electron.BrowserWindow | null = null;

	static setHistoryManager(manager: TranscriptionHistoryManager): void {
		HistoryWindowHelper.historyManager = manager;
	}

	static async appendTranscriptionToHistory(text: string): Promise<void> {
		if (!HistoryWindowHelper.historyManager) {
			console.error('[HistoryWindowHelper] History manager not initialized');
			return;
		}

		await HistoryWindowHelper.historyManager.append(text);

		// Notify the history window if it's open
		if (HistoryWindowHelper.historyWindow && !HistoryWindowHelper.historyWindow.isDestroyed()) {
			const updatedHistory = HistoryWindowHelper.historyManager.getAll();
			HistoryWindowHelper.historyWindow.webContents.send(IPC_CHANNELS.HISTORY_UPDATED, updatedHistory);
		}
	}

	static async openHistoryWindow(): Promise<void> {
		if (HistoryWindowHelper.historyWindow && !HistoryWindowHelper.historyWindow.isDestroyed()) {
			HistoryWindowHelper.historyWindow.focus();
			return;
		}
		HistoryWindowHelper.historyWindow = new Electron.BrowserWindow({
			width: 800,
			height: 600,
			title: 'Transcription History',
			webPreferences: {
				preload: ProjectPath.PRELOAD_JS,
				nodeIntegration: false,
				contextIsolation: true,
			},
		});
		HistoryWindowHelper.historyWindow.on('closed', () => { HistoryWindowHelper.historyWindow = null; });
		await HistoryWindowHelper.historyWindow.loadFile(Path.join(ProjectPath.ROOT, 'public/history-window/index.html'));
		// HistoryWindowHelper.historyWindow.webContents.openDevTools();
	}

	static getHistory(): TranscriptionHistoryEntry[] {
		if (!HistoryWindowHelper.historyManager) {
			return [];
		}
		return HistoryWindowHelper.historyManager.getAll();
	}

	static async clearHistory(): Promise<void> {
		if (!HistoryWindowHelper.historyManager) {
			console.error('[HistoryWindowHelper] History manager not initialized');
			return;
		}
		await HistoryWindowHelper.historyManager.clear();

		// Notify the history window if it's open
		if (HistoryWindowHelper.historyWindow && !HistoryWindowHelper.historyWindow.isDestroyed()) {
			HistoryWindowHelper.historyWindow.webContents.send(IPC_CHANNELS.HISTORY_UPDATED, []);
		}
	}
}
