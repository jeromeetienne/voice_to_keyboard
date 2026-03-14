document.addEventListener('DOMContentLoaded', async () => {
    const historySelect = document.getElementById('historySelect');
    const entryTime = document.getElementById('entryTime');
    const entryText = document.getElementById('entryText');
    const copyBtn = document.getElementById('copyBtn');

    if (!(historySelect instanceof HTMLSelectElement)) throw new Error('historySelect not found');
    if (!(entryTime instanceof HTMLDivElement)) throw new Error('entryTime not found');
    if (!(entryText instanceof HTMLDivElement)) throw new Error('entryText not found');
    if (!(copyBtn instanceof HTMLButtonElement)) throw new Error('copyBtn not found');

    if (!window.electronAPI || typeof window.electronAPI.getTranscriptionHistory !== 'function') {
        entryTime.textContent = 'History API unavailable.';
        entryText.textContent = 'This page must run inside the Electron app.';
        historySelect.disabled = true;
        copyBtn.disabled = true;
        return;
    }

    function formatTimestamp(isoTimestamp) {
        const date = new Date(isoTimestamp);
        if (Number.isNaN(date.getTime())) return isoTimestamp;
        return date.toLocaleString();
    }

    function formatPreview(text) {
        if (text.length <= 65) return text;
        return `${text.slice(0, 65)}...`;
    }

    function renderSelection(entries, index) {
        const entry = entries[index];
        if (!entry || typeof entry.text !== 'string') {
            entryTime.textContent = 'Entry unavailable.';
            entryText.textContent = '';
            copyBtn.disabled = true;
            return;
        }
        entryTime.textContent = `Created: ${formatTimestamp(entry.createdAt)}`;
        entryText.textContent = entry.text;
        copyBtn.disabled = false;
    }

    function populateSelect(entries) {
        const previousText = historySelect.options[historySelect.selectedIndex]?.text ?? null;
        historySelect.innerHTML = '';

        if (!Array.isArray(entries) || entries.length === 0) {
            entryTime.textContent = 'No history yet.';
            entryText.textContent = 'Record and transcribe audio to populate history.';
            historySelect.disabled = true;
            copyBtn.disabled = true;
            return;
        }

        entries.forEach((entry, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = `${index + 1}. ${formatPreview(entry.text)}`;
            historySelect.append(option);
        });

        historySelect.disabled = false;

        // Keep the same entry selected if it still exists, otherwise select the newest (index 0)
        const matchIndex = [...historySelect.options].findIndex(o => o.text === previousText);
        historySelect.value = matchIndex >= 0 ? String(matchIndex) : '0';
        renderSelection(entries, Number(historySelect.value));
    }

    let historyEntries = await window.electronAPI.getTranscriptionHistory();
    populateSelect(historyEntries);

    historySelect.addEventListener('change', () => {
        renderSelection(historyEntries, Number(historySelect.value));
    });

    copyBtn.addEventListener('click', async () => {
        const selectedEntry = historyEntries[Number(historySelect.value)];
        if (!selectedEntry || typeof selectedEntry.text !== 'string') return;
        try {
            await navigator.clipboard.writeText(selectedEntry.text);
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy Selected Text'; }, 1200);
        } catch {
            copyBtn.textContent = 'Copy failed';
            setTimeout(() => { copyBtn.textContent = 'Copy Selected Text'; }, 1200);
        }
    });

    if (typeof window.electronAPI.onHistoryUpdated === 'function') {
        window.electronAPI.onHistoryUpdated((entries) => {
            historyEntries = entries;
            populateSelect(entries);
        });
    }
});
