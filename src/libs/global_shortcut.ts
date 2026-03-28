// node imports
import Assert from 'assert'

// npm imports
import iohook from 'iohook-macos'
import type { EventData, AccessibilityPermissionsResult, EventFilterOptions } from 'iohook-macos'

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Type
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export type GlobalShortcutCallback = () => void;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	class GlobalShortcut
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export class GlobalShortcut {
	private _onStart: GlobalShortcutCallback;
	private _onStop: GlobalShortcutCallback;
	private _isRunning: boolean;

	constructor(onStart: GlobalShortcutCallback, onStop: GlobalShortcutCallback) {
		this._onStart = onStart;
		this._onStop = onStop;
		this._isRunning = false;

		iohook.addListener('keyDown', (eventData: EventData) => {
			// GlobalShortcut.displayEventData(eventData)

			// if not the proper key, return now
			const isPushToTalkKey = this.isPushToTalkKey(eventData, 'keyDown')
			if (isPushToTalkKey === false) return

			// if already running, return now
			if (this._isRunning === true) return

			// mark as running
			// - important as it handle the case where the user press the key while already pressing it, which 
			// can happen if the user hold the key for a long time and trigger multiple keyDown events
			this._isRunning = true;

			// notify the start callback
			this._onStart()
		})
		iohook.addListener('keyUp', (eventData: EventData) => {
			// if not the proper key, return now
			const isPushToTalkKey = this.isPushToTalkKey(eventData, 'keyUp')
			if (isPushToTalkKey === false) return

			// if not running, return now
			// - may happen if the user was pressing a key when launching the application
			if (this._isRunning === false) return

			// mark as not running
			this._isRunning = false;

			// notify the stop callback
			this._onStop()
		})

		iohook.setVerboseLogging(false);
		iohook.enablePerformanceMode();
	}


	async start() {
		iohook.startMonitoring();
	}

	async stop() {
		iohook.stopMonitoring();
	}

	isPushToTalkKey(eventData: EventData, eventType: 'keyDown' | 'keyUp'): boolean {
		// key code 7 is the 'X' key
		// key code 30 is the ']' key
		if (eventData.keyCode !== 30) return false

		if (eventType === 'keyDown') {
			if (eventData.modifiers.shift !== false) return false
			if (eventData.modifiers.control !== false) return false
			if (eventData.modifiers.option !== true) return false
			if (eventData.modifiers.command !== true) return false
			if (eventData.modifiers.capsLock !== false) return false
			if (eventData.modifiers.fn !== false) return false
		}
		// if all checks passed, return true
		return true
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	static function
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static async displayEventData(eventData: EventData) {
		const outputStr = [
			`Event Type: ${eventData.type}`,
			`   Key Code: ${eventData.keyCode}`,
			`   Modifiers: ${JSON.stringify(eventData.modifiers, null, 2)}`
		].join('\n')
		console.log(outputStr);
	}

	/**
	 * Checks if the application has the necessary accessibility permissions to monitor keyboard events.
	 * This is required on macOS for iohook to function properly. The function returns a boolean indicating 
	 * whether the permissions are granted or not.
	 */
	static async checkPermissions(): Promise<boolean> {
		const result = iohook.checkAccessibilityPermissions()
		const hasPermissions = result.hasPermissions
		return hasPermissions;
	}

	/**
	 * Requests accessibility permissions from the user. This will trigger a system prompt 
	 * asking the user to grant permissions. The function returns a boolean indicating whether the 
	 * permissions were granted or not.
	 * 
	 * @returns {Promise<boolean>} - A promise that resolves to true if permissions were granted, or false if 
	 * they were denied.
	 */
	static async requestPermissions(): Promise<boolean> {
		const result = iohook.requestAccessibilityPermissions()
		const hasPermissions = result.hasPermissions
		return hasPermissions;
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

if (require.main === module) {
	const onStart: GlobalShortcutCallback = () => {
		console.log('start recording')
	}
	const onStop: GlobalShortcutCallback = () => {
		console.log('stop recording')
	}
	const ioBindingHelper = new GlobalShortcut(onStart, onStop)
	ioBindingHelper.start()
	console.log('Monitoring started. Press Cmd+Shift+R to trigger events...')
}