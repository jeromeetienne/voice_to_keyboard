import Path from 'node:path';
import Fs from 'node:fs';
import Os from 'node:os';

export type TranscriptionHistoryEntry = {
	text: string;
	createdAt: string;
};

export class TranscriptionHistoryManager {
	private historyFilePath: string;
	private history: TranscriptionHistoryEntry[] = [];
	private maxEntries: number;

	constructor(maxEntries: number = 100, projectRoot?: string) {
		this.maxEntries = maxEntries;
		// If projectRoot is not provided, default to user's home directory
		const baseDir = projectRoot || Os.homedir();
		this.historyFilePath = Path.join(baseDir, '.transcription_history.json');
	}

	/**
	 * Load history from file. If file doesn't exist, starts with empty history.
	 */
	async load(): Promise<void> {
		try {
			if (Fs.existsSync(this.historyFilePath)) {
				const fileContent = await Fs.promises.readFile(this.historyFilePath, 'utf-8');
				this.history = JSON.parse(fileContent);
				console.log(`[TranscriptionHistoryManager] Loaded ${this.history.length} entries from history file`);
			} else {
				this.history = [];
				console.log('[TranscriptionHistoryManager] History file does not exist, starting with empty history');
			}
		} catch (error) {
			console.error('[TranscriptionHistoryManager] Error loading history:', error);
			this.history = [];
		}
	}

	/**
	 * Save history to file
	 */
	private async save(): Promise<void> {
		try {
			await Fs.promises.writeFile(
				this.historyFilePath,
				JSON.stringify(this.history, null, 2),
				'utf-8'
			);
		} catch (error) {
			console.error('[TranscriptionHistoryManager] Error saving history:', error);
		}
	}

	/**
	 * Add a new transcription to the history (newest first)
	 */
	async append(text: string): Promise<void> {
		const newEntry: TranscriptionHistoryEntry = {
			text,
			createdAt: new Date().toISOString(),
		};

		// Add to the beginning of the array (newest first)
		this.history.unshift(newEntry);

		// Trim to max entries
		if (this.history.length > this.maxEntries) {
			this.history = this.history.slice(0, this.maxEntries);
		}

		await this.save();
	}

	/**
	 * Get all history entries
	 */
	getAll(): TranscriptionHistoryEntry[] {
		return [...this.history];
	}

	/**
	 * Get history file path (useful for debugging)
	 */
	getFilePath(): string {
		return this.historyFilePath;
	}

	/**
	 * Clear all history
	 */
	async clear(): Promise<void> {
		this.history = [];
		await this.save();
		console.log('[TranscriptionHistoryManager] History cleared');
	}
}
