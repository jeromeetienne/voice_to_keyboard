// JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get the version from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const version = urlParams.get('version') || '1.0.0';
    const modelName = urlParams.get('model') || 'medium.en';

    const versionEl = /** @type {HTMLSpanElement | null} */ (document.getElementById('version'));
    const modelEl = /** @type {HTMLSpanElement | null} */ (document.getElementById('modelName'));
    const closeBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('closeBtn'));

    if (versionEl === null) throw new Error('version element not found');
    if (modelEl === null) throw new Error('modelName element not found');
    if (closeBtn === null) throw new Error('closeBtn element not found');

    // Display the version and model
    versionEl.textContent = version;
    modelEl.textContent = modelName;

    // Close button functionality
    closeBtn.addEventListener('click', () => {
        window.close();
    });
});
