import Path from 'node:path';

import Electron from 'electron';
import { AppConfig, AppConfigManager } from '../../libs/app_config';
import { IPC_LOG_PREFIX } from './ipc_channels';
import { ProjectPath } from './project_path';

export class ConfigWindowHelper {
	// Configuration window instance
	private static configWindow: Electron.BrowserWindow | null = null;
	// Reference to AppConfigManager (will be set in ElectronMain.main)
	private static appConfigManager: any = null;
	// Current app configuration
	private static currentConfig: AppConfig | null = null;

	/**
	 * Set the AppConfigManager instance
	 */
	static setAppConfigManager(manager: any): void {
		ConfigWindowHelper.appConfigManager = manager;
	}

	/**
	 * Set the current app configuration
	 */
	static setCurrentConfig(config: AppConfig): void {
		ConfigWindowHelper.currentConfig = config;
	}

	/**
	 * Open the configuration window or focus existing one
	 */
	static async openConfigWindow(): Promise<void> {
		if (ConfigWindowHelper.configWindow && !ConfigWindowHelper.configWindow.isDestroyed()) {
			ConfigWindowHelper.configWindow.focus();
			return;
		}
		ConfigWindowHelper.configWindow = new Electron.BrowserWindow({
			width: 700,
			height: 600,
			title: 'Voice to Keyboard Configuration',
			webPreferences: {
				preload: ProjectPath.PRELOAD_JS,
				nodeIntegration: false,
				contextIsolation: true,
			},
		});
		ConfigWindowHelper.configWindow.on('closed', () => { ConfigWindowHelper.configWindow = null; });
		await ConfigWindowHelper.configWindow.loadFile(Path.join(ProjectPath.ROOT, 'public/config-window/index.html'));
	}

	/**
	 * Get current configuration
	 */
	static getConfig(): AppConfig {
		return ConfigWindowHelper.currentConfig || AppConfigManager.getDefaultConfig();
	}

	/**
	 * Save configuration
	 */
	static async saveConfig(config: AppConfig): Promise<void> {
		if (!ConfigWindowHelper.appConfigManager) {
			throw new Error('AppConfigManager not initialized');
		}
		try {
			// Save the new config using the AppConfigManager
			await ConfigWindowHelper.appConfigManager.save(config);
			ConfigWindowHelper.currentConfig = config;
			console.info(`${IPC_LOG_PREFIX} config saved successfully`);

			// Show a notification to the user that the config was saved and the app will relaunch
			new Electron.Notification({
				title: 'Voice to Keyboard',
				body: 'Configuration saved. The application will relaunch in 3 seconds.'
			}).show();

			// Wait a few seconds to ensure the user sees the notification before relaunching
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Relaunch the app to apply the new configuration
			Electron.app.relaunch();
			Electron.app.exit(0);
		} catch (error) {
			console.error(`${IPC_LOG_PREFIX} failed to save config:`, error);
			throw error;
		}
	}

	/**
	 * Get available languages
	 */
	static getAvailableLanguages(): string[] {
		return AppConfigManager.getAvailableLanguages();
	}

	/**
	 * Get available models
	 */
	static getAvailableModels(): string[] {
		return AppConfigManager.getAvailableModels();
	}

	/**
	 * Get default configuration
	 */
	static getDefaultConfig(): AppConfig {
		return AppConfigManager.getDefaultConfig();
	}
}
