import { ipcRenderer } from 'electron';

const adobeUrlInput = document.getElementById('AdobeUrl');
const whiskWorkersInput = document.getElementById('WhiskWorkers');
const pageInput = document.getElementById('Page');
const submitBtn = document.getElementById('submitBtn');
const statusDiv = document.getElementById('status');

submitBtn.addEventListener('click', async () => {
    const url = adobeUrlInput.value.trim();
    const whiskWorkers = Number(whiskWorkersInput.value);
    const page = Number(pageInput.value);

    // Validasi
    if (!url) {
        showStatus('Masukkan URL Adobe!', 'error');
        return;
    }

    if (whiskWorkers < 1 || whiskWorkers > 2) {
        showStatus('WhiskWorkers harus 1 atau 2!', 'error');
        return;
    }

    if (page < 1) {
        showStatus('Page minimal 1!', 'error');
        return;
    }

    // Disable button dan tampilkan loading
    submitBtn.disabled = true;
    showStatus('Processing... menunggu hasil scraping', 'loading');

    try {
        const result = await ipcRenderer.invoke('start-scraping', {
            URL: url,
            WhiskWorkers: whiskWorkers,
            pageCustom: page
        });

        showStatus(`✓ Scraping selesai! Data: ${result.message}`, 'success');
    } catch (err) {
        showStatus(`✗ Error: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}