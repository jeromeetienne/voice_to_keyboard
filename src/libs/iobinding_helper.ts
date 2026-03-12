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

export type IOBindingCallback = () => void;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	class IOBindingHelper
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export class IOBindingHelper {
	private _onStart: IOBindingCallback;
	private _onStop: IOBindingCallback;
	private _isRunning: boolean;

	constructor(onStart: IOBindingCallback, onStop: IOBindingCallback) {
		this._onStart = onStart;
		this._onStop = onStop;
		this._isRunning = false;

		iohook.addListener('keyDown', (eventData: EventData) => {
			// console.log('Key Down:', {
			// 	type: eventData.type,
			// 	keyCode: eventData.keyCode,
			// 	command: eventData.modifiers.command,
			// 	shift: eventData.modifiers.shift,
			// 	timestamp: eventData.timestamp,
			// 	processId: eventData.processId
			// })
			if (eventData.modifiers.command === false) return
			if (eventData.modifiers.shift === false) return
			if (eventData.keyCode !== 15 /* R key */) return
			if (this._isRunning) return
			this._isRunning = true;
			// console.log('start')
			this._onStart()
		})
		iohook.addListener('keyUp', (eventData: EventData) => {
			// console.log('Key Up:', {
			// 	type: eventData.type,
			// 	keyCode: eventData.keyCode,
			// 	command: eventData.modifiers.command,
			// 	shift: eventData.modifiers.shift,
			// 	timestamp: eventData.timestamp,
			// 	processId: eventData.processId
			// })

			if (eventData.modifiers.command === false) return
			if (eventData.modifiers.shift === false) return
			if (eventData.keyCode !== 15 /* R key */) return

			Assert.ok(this._isRunning, 'Received keyUp event without a corresponding keyDown event')
			this._isRunning = false;
			// console.log('stop')
			this._onStop()
		})
	}


	async start() {
		iohook.startMonitoring();
	}

	async stop() {
		iohook.stopMonitoring();
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
	const onStart: IOBindingCallback = () => {
		console.log('start recording')
	}
	const onStop: IOBindingCallback = () => {
		console.log('stop recording')
	}
	const ioBindingHelper = new IOBindingHelper(onStart, onStop)
	ioBindingHelper.start()
	console.log('Monitoring started. Press Cmd+Shift+R to trigger events...')
}