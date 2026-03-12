// TypeScript usage example for iohook-macos
import iohook from 'iohook-macos'
import type { EventData, AccessibilityPermissionsResult, EventFilterOptions } from 'iohook-macos'

// String-based event listeners (type-safe)
iohook.on('keyDown', (eventData: EventData) => {
	console.log('🔽 Key Down:', {
		type: eventData.type,
		keyCode: eventData.keyCode,
		command: eventData.modifiers.command,
		shift: eventData.modifiers.shift,
		timestamp: eventData.timestamp,
		processId: eventData.processId
	})
})

iohook.startMonitoring()
console.log('iohook-macos is monitoring global events. Press any key to see the output...')