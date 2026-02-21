import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadFile('public/index.html')
}

app.whenReady().then(() => {
  createWindow()

  // Handle scraping request dari UI
  ipcMain.handle('start-scraping', async (event, params) => {
    const { URL, WhiskWorkers, pageCustom } = params;
    
    try {
      // Import fungsi scraping kamu di sini
      // const result = await startScrapingProcess(URL, WhiskWorkers, pageCustom);
      
      // Placeholder - ganti dengan logika scraping kamu
      return {
        message: `Scraping dimulai dengan ${WhiskWorkers} workers untuk ${pageCustom} page(s)`,
        data: null
      };
    } catch (err) {
      throw new Error(`Scraping error: ${err.message}`);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})