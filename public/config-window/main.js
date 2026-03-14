/**
 * @typedef {{ transcriptionLanguage: string, transcriptionModel: string }} AppConfig
 */


/**
 * @typedef {{
 *   getConfig: () => Promise<AppConfig>,
 *   saveConfig: (config: AppConfig) => Promise<void>,
 *   getAvailableLanguages: () => Promise<string[]>,
 *   getAvailableModels: () => Promise<string[]>,
 *   getDefaultConfig: () => Promise<AppConfig>
 * }} ElectronAPI
 */

/**
 * Created in the preload script and exposed via contextBridge
 *
 * @type {ElectronAPI}
 */
// @ts-ignore - electronAPI is injected by preload script
let electronAPI = electronAPI;

document.addEventListener('DOMContentLoaded', async () => {
    const configForm = /** @type {HTMLFormElement} */ (document.querySelector('#configForm'));
    const languageSelect = /** @type {HTMLSelectElement} */ (document.querySelector('#languageSelect'));
    const modelSelect = /** @type {HTMLSelectElement} */ (document.querySelector('#modelSelect'));
    const resetBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#resetBtn'));
    const successMessage = /** @type {HTMLDivElement} */ (document.querySelector('#successMessage'));
    const errorMessage = /** @type {HTMLDivElement} */ (document.querySelector('#errorMessage'));
    const errorText = /** @type {HTMLSpanElement} */ (document.querySelector('#errorText'));

    if (!electronAPI || typeof electronAPI.getConfig !== 'function') {
        errorText.textContent = 'This page must run inside the Electron app.';
        errorMessage.hidden = false;
        configForm.style.display = 'none';
        return;
    }

    /**
     * Hide success and error messages
     */
    function hideMessages() {
        successMessage.hidden = true;
        errorMessage.hidden = true;
    }

    /**
     * Show error message
     * @param {string} message
     */
    function showError(message) {
        errorText.textContent = message;
        errorMessage.hidden = false;
        successMessage.hidden = true;
    }

    /**
     * Show success message
     */
    function showSuccess() {
        successMessage.hidden = false;
        errorMessage.hidden = true;
        setTimeout(hideMessages, 3000);
    }

    /**
     * Load and populate available languages
     */
    async function loadLanguages() {
        try {
            const languages = await electronAPI.getAvailableLanguages();
            languageSelect.innerHTML = '<option value="">Select a language...</option>';
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang;
                languageSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Failed to load languages: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load and populate available models
     */
    async function loadModels() {
        try {
            const models = await electronAPI.getAvailableModels();
            modelSelect.innerHTML = '<option value="">Select a model...</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Failed to load models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load current configuration
     */
    async function loadConfig() {
        try {
            const config = await electronAPI.getConfig();
            if (config) {
                languageSelect.value = config.transcriptionLanguage;
                modelSelect.value = config.transcriptionModel;
            }
        } catch (error) {
            showError(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Initialize form
    await loadLanguages();
    await loadModels();
    await loadConfig();

    // Form submission
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        if (!languageSelect.value || !modelSelect.value) {
            showError('Please select both a language and a model.');
            return;
        }

        try {
            const config = {
                transcriptionLanguage: languageSelect.value,
                transcriptionModel: modelSelect.value,
            };
            await electronAPI.saveConfig(config);
            showSuccess();
        } catch (error) {
            showError(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Reset to defaults
    resetBtn.addEventListener('click', async () => {
        hideMessages();
        try {
            const defaultConfig = await electronAPI.getDefaultConfig();
            languageSelect.value = defaultConfig.transcriptionLanguage;
            modelSelect.value = defaultConfig.transcriptionModel;
        } catch (error) {
            showError(`Failed to load defaults: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
});
