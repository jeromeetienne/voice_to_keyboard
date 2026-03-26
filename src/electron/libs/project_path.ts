import Path from 'node:path';

export class ProjectPath {
	/**
	 * Root directory of the project
	 */
	static ROOT = Path.join(__dirname, '../../..');

	/**
	 * Path to the preload script used in BrowserWindow webPreferences
	 */
	static PRELOAD_JS = Path.join(ProjectPath.ROOT, 'src/electron/preload.js');
}