export const IPC_CHANNELS = {
	SHOW_ABOUT: 'show-about',
	MENU_ABOUT_CLICKED: 'menu-about-clicked',
	GET_TRANSCRIPTION_HISTORY: 'get-transcription-history',
	HISTORY_UPDATED: 'history-updated',
	GET_CONFIG: 'get-config',
	SAVE_CONFIG: 'save-config',
	GET_AVAILABLE_LANGUAGES: 'get-available-languages',
	GET_AVAILABLE_MODELS: 'get-available-models',
	GET_DEFAULT_CONFIG: 'get-default-config',
	CLEAR_HISTORY: 'clear-history',
} as const;

export const IPC_LOG_PREFIX = '[voice2key][ipc]';
