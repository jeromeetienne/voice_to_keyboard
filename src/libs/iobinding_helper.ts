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