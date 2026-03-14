// JavaScript functionality
const ABOUT_LOG_PREFIX = '[voice2key][about]';

document.addEventListener('DOMContentLoaded', () => {
    console.info(`${ABOUT_LOG_PREFIX} DOMContentLoaded`);

    // Get the version from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const version = urlParams.get('version') || '1.0.0';
    const modelName = urlParams.get('model') || 'medium.en';

    console.info(`${ABOUT_LOG_PREFIX} parsed params`, { version, modelName, search: window.location.search });

    const versionEl = /** @type {HTMLSpanElement | null} */ (document.getElementById('version'));
    const modelEl = /** @type {HTMLSpanElement | null} */ (document.getElementById('modelName'));
    const closeBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('closeBtn'));

    if (versionEl === null) throw new Error('version element not found');
    if (modelEl === null) throw new Error('modelName element not found');
    if (closeBtn === null) throw new Error('closeBtn element not found');

    console.info(`${ABOUT_LOG_PREFIX} required DOM elements found`);

    // Display the version and model
    versionEl.textContent = version;
    modelEl.textContent = modelName;

    // Close button functionality
    closeBtn.addEventListener('click', () => {
        console.info(`${ABOUT_LOG_PREFIX} close button clicked`);
        window.close();
    });

    window.addEventListener('beforeunload', () => {
        console.info(`${ABOUT_LOG_PREFIX} beforeunload fired`);
    });
});
