document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('historyList');
    const detailEmpty = document.getElementById('detailEmpty');
    const detailContent = document.getElementById('detailContent');
    const entryTime = document.getElementById('entryTime');
    const entryText = document.getElementById('entryText');
    const copyBtn = document.getElementById('copyBtn');

    if (!(historyList instanceof HTMLUListElement)) throw new Error('historyList not found');
    if (!(detailEmpty instanceof HTMLDivElement)) throw new Error('detailEmpty not found');
    if (!(detailContent instanceof HTMLDivElement)) throw new Error('detailContent not found');
    if (!(entryTime instanceof HTMLDivElement)) throw new Error('entryTime not found');
    if (!(entryText instanceof HTMLDivElement)) throw new Error('entryText not found');
    if (!(copyBtn instanceof HTMLButtonElement)) throw new Error('copyBtn not found');

    if (!window.electronAPI || typeof window.electronAPI.getTranscriptionHistory !== 'function') {
        detailEmpty.textContent = 'This page must run inside the Electron app.';
        copyBtn.disabled = true;
        return;
    }

    let selectedIndex = -1;

    function formatTimestamp(isoTimestamp) {
        const date = new Date(isoTimestamp);
        if (Number.isNaN(date.getTime())) return isoTimestamp;
        return date.toLocaleString();
    }

    function formatPreview(text) {
        if (text.length <= 55) return text;
        return `${text.slice(0, 55)}…`;
    }

    function showDetail(entries, index) {
        const entry = entries[index];
        if (!entry || typeof entry.text !== 'string') {
            detailEmpty.hidden = false;
            detailContent.hidden = true;
            return;
        }
        entryTime.textContent = `Created: ${formatTimestamp(entry.createdAt)}`;
        entryText.textContent = entry.text;
        detailEmpty.hidden = true;
        detailContent.hidden = false;
    }

    function populateList(entries) {
        historyList.innerHTML = '';

        if (!Array.isArray(entries) || entries.length === 0) {
            detailEmpty.textContent = 'No history yet. Record and transcribe audio to populate history.';
            detailEmpty.hidden = false;
            detailContent.hidden = true;
            copyBtn.disabled = true;
            return;
        }

        entries.forEach((entry, index) => {
            const li = document.createElement('li');

            const preview = document.createElement('div');
            preview.className = 'list-preview';
            preview.textContent = formatPreview(entry.text);

            const date = document.createElement('div');
            date.className = 'list-date';
            date.textContent = formatTimestamp(entry.createdAt);

            li.append(preview, date);
            li.addEventListener('click', () => {
                document.querySelectorAll('#historyList li').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                selectedIndex = index;
                showDetail(entries, index);
                copyBtn.disabled = false;
            });

            historyList.append(li);
        });

        // Restore selection or default to first item
        const clampedIndex = selectedIndex >= 0 && selectedIndex < entries.length ? selectedIndex : 0;
        historyList.querySelectorAll('li')[clampedIndex]?.classList.add('selected');
        selectedIndex = clampedIndex;
        showDetail(entries, clampedIndex);
        copyBtn.disabled = false;
    }

    let historyEntries = await window.electronAPI.getTranscriptionHistory();
    populateList(historyEntries);

    copyBtn.addEventListener('click', async () => {
        const selectedEntry = historyEntries[selectedIndex];
        if (!selectedEntry || typeof selectedEntry.text !== 'string') return;
        try {
            await navigator.clipboard.writeText(selectedEntry.text);
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy Text'; }, 1200);
        } catch {
            copyBtn.textContent = 'Copy failed';
            setTimeout(() => { copyBtn.textContent = 'Copy Text'; }, 1200);
        }
    });

    if (typeof window.electronAPI.onHistoryUpdated === 'function') {
        window.electronAPI.onHistoryUpdated((entries) => {
            historyEntries = entries;
            populateList(entries);
        });
    }
});
