import Path from 'node:path';
import Fs from 'node:fs';

import Electron from 'electron';
import { IPC_CHANNELS, IPC_LOG_PREFIX } from './ipc_channels';
import { ProjectPath } from './project_path';

export class AboutDialogHelper {
	/**
	 * Reads and returns the version of VoiceToKeyboard from package.json.
	 */
	static async getVoiceToKeyboardVersion(): Promise<string> {
		const filePath = Path.join(ProjectPath.ROOT, './package.json');
		const fileContent = await Fs.promises.readFile(filePath, 'utf-8');
		const packageJson = JSON.parse(fileContent);
		return packageJson.version;
	}

	/**
	 * Displays the About dialog with version and environment information.
	 * Uses Electron's dialog API to show a message box.
	 */
	static async showAboutDialog(): Promise<void> {
		console.info(`${IPC_LOG_PREFIX} showAboutDialog requested`);
		const detailContent = [
			`It is a push to talk application that converts your voice into keyboard input, allowing you to control your computer using voice commands.`,
			``,
			`By Jérôme Etienne`,
			``,
			`Version: ${await AboutDialogHelper.getVoiceToKeyboardVersion()}`,
			`Electron: ${process.versions.electron}`,
			`Node: ${process.versions.node}`
		].join('\n');
		await Electron.dialog.showMessageBox({
			type: "info",
			title: "About Voice to Keyboard",
			message: "Voice to Keyboard",
			detail: detailContent,
			buttons: ["OK"],
		});
		console.info(`${IPC_LOG_PREFIX} showAboutDialog completed`);
	}

	/**
	 * Triggers the About dialog from the tray menu.
	 * If the hidden window exists, sends an IPC message to it.
	 * Otherwise, shows the About dialog directly as a fallback.
	 * @param targetWindow The hidden BrowserWindow used for IPC communication.
	 */
	static triggerAboutFromMenu(targetWindow: Electron.BrowserWindow | null): void {
		console.info(`${IPC_LOG_PREFIX} menu click received, forwarding via ${IPC_CHANNELS.MENU_ABOUT_CLICKED}`);
		if (targetWindow && !targetWindow.isDestroyed()) {
			console.info(`${IPC_LOG_PREFIX} sending ${IPC_CHANNELS.MENU_ABOUT_CLICKED} to hidden window`);
			targetWindow.webContents.send(IPC_CHANNELS.MENU_ABOUT_CLICKED);
			return;
		}

		// Fallback for unexpected cases where the hidden window is unavailable.
		console.warn(`${IPC_LOG_PREFIX} hidden window unavailable, falling back to direct dialog`);
		void AboutDialogHelper.showAboutDialog();
	}
}
