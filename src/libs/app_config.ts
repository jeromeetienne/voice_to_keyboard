// node import
import Fs from 'fs';
import Path from 'path';

// npm import
import { Language } from '@remotion/install-whisper-cpp';

// local import
import { TranscriptionModelName } from './transcription_whisper';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Types
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export interface AppConfig {
	transcriptionLanguage: Language;
	transcriptionModel: TranscriptionModelName;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Class
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export class AppConfigManager {
	private configPath: string;

	constructor(configPath: string = Path.resolve(__dirname, '../../outputs/appconfig.json')) {
		this.configPath = configPath;
	}

	/**
	 * Load the application configuration from the JSON file
	 * @returns the app configuration, or null if file doesn't exist
	 */
	async load(): Promise<AppConfig | null> {
		try {
			if (!Fs.existsSync(this.configPath)) {
				return null;
			}
			const data = await Fs.promises.readFile(this.configPath, 'utf-8');
			const config = JSON.parse(data) as AppConfig;
			return config;
		} catch (error) {
			console.error('Failed to load app config:', error);
			return null;
		}
	}

	/**
	 * Save the application configuration to the JSON file
	 * @param config the configuration to save
	 */
	async save(config: AppConfig): Promise<void> {
		try {
			// Ensure output directory exists
			const outputDir = Path.dirname(this.configPath);
			if (!Fs.existsSync(outputDir)) {
				await Fs.promises.mkdir(outputDir, { recursive: true });
			}

			// Write the config file
			await Fs.promises.writeFile(this.configPath, JSON.stringify(config, null, 2));
		} catch (error) {
			console.error('Failed to save app config:', error);
			throw error;
		}
	}

	/**
	 * Get the list of available Whisper models
	 */
	static getAvailableModels(): TranscriptionModelName[] {
		return [
			'tiny',
			'tiny.en',
			'base',
			'base.en',
			'small',
			'small.en',
			'medium',
			'medium.en',
			'large-v1',
			'large-v2',
			'large-v3',
			'large-v3-turbo',
		];
	}

	/**
	 * Get the list of available languages supported by Whisper
	 */
	static getAvailableLanguages(): Language[] {
		return [
			'en', // English
			'es', // Spanish
			'fr', // French
			'de', // German
			'it', // Italian
			'pt', // Portuguese
			'nl', // Dutch
			'ru', // Russian
			'zh', // Chinese
			'ja', // Japanese
			'ko', // Korean
			'ar', // Arabic
			'hi', // Hindi
			'tr', // Turkish
			'pl', // Polish
			'uk', // Ukrainian
			'sv', // Swedish
			'fi', // Finnish
			'da', // Danish
			'no', // Norwegian
		] as Language[];
	}

	/**
	 * Get a default configuration
	 */
	static getDefaultConfig(): AppConfig {
		return {
			transcriptionLanguage: 'en',
			transcriptionModel: 'medium.en',
		};
	}
}

///////////////////////////////////////////////////////////////////////////////
// minitest — runs only when executed directly
///////////////////////////////////////////////////////////////////////////////
if (require.main === module) {
	(async () => {
		console.log('AppConfigManager minitest…');

		const configManager = new AppConfigManager();

		// Test getting available models
		const models = AppConfigManager.getAvailableModels();
		console.log('Available models:', models);

		// Test getting available languages
		const languages = AppConfigManager.getAvailableLanguages();
		console.log('Available languages:', languages);

		// Test getting default config
		const defaultConfig = AppConfigManager.getDefaultConfig();
		console.log('Default config:', defaultConfig);

		// Test saving and loading
		const testConfig: AppConfig = {
			transcriptionLanguage: 'en',
			transcriptionModel: 'medium.en',
		};

		await configManager.save(testConfig);
		console.log('Config saved to:', Path.resolve(__dirname, '../../outputs/appconfig.json'));

		const loadedConfig = await configManager.load();
		console.log('Loaded config:', loadedConfig);

		console.log('minitest passed ✓');
	})();
}
