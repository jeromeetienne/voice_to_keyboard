// JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
	// Get the transcribed text from URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const text = urlParams.get('text') || '';
	const isElectron = urlParams.get('electron') === 'true';

	const textBox = /** @type {HTMLDivElement | null} */ (document.getElementById('textBox'));
	const copyButton = /** @type {HTMLButtonElement | null} */ (document.getElementById('copyBtn'));
	const infoDiv = /** @type {HTMLDivElement | null} */ (document.getElementById('info'));

	if (textBox === null) throw new Error('textBox element not found');
	if (copyButton === null) throw new Error('copyBtn element not found');
	if (infoDiv === null) throw new Error('infoDiv element not found');



	// Display the text
	if (text) {
		textBox.textContent = text;
	} else {
		textBox.innerHTML = '<div class="error">No transcribed text provided</div>';
		copyButton.disabled = true;
		infoDiv.textContent = 'No text to copy';
	}

	// Copy button functionality
	copyButton.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(text);
			copyButton.textContent = 'Copied!';
			copyButton.classList.add('copied');
			setTimeout(() => {
				copyButton.textContent = 'Copy to Clipboard';
				copyButton.classList.remove('copied');
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
			copyButton.textContent = 'Copy failed';
			setTimeout(() => {
				copyButton.textContent = 'Copy to Clipboard';
			}, 2000);
		}
	});

	// If running in Electron, close after 10 seconds
	if (isElectron) {
		setTimeout(() => {
			window.close();
		}, 10000);
	}
});
