import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import { main as runMain } from "../automation_server/index.js"
import dotenv from "dotenv"
import { env } from "../automation_server/utils/CliAsk/inputEnv.js"


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, "..", "automation_server", ".env")
})



function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true
        }
    })
    win.loadFile(path.join(__dirname, "renderer", "index.html"))
}

app.whenReady().then(createWindow)

// controller map per renderer to support stop
const controllers = new Map()

ipcMain.handle("start-bot", async (event, config) => {
    const origLog = console.log
    const origErr = console.error

    console.log = (...args) => {
        event.sender.send("bot-stdout", args.join(" "))
        origLog(...args)
    }

    console.error = (...args) => {
        event.sender.send("bot-stderr", args.join(" "))
        origErr(...args)
    }   

    try {
        await runMain(config)
        console.log("ABOUT TO RUN MAIN")
        event.sender.send("bot-exit", 0)
    } catch (err) {
        event.sender.send("bot-error", String(err))
    } finally {
        console.log = origLog
        console.error = origErr
    }
})

ipcMain.handle("save-settings", async (event, settingsSystem) => {
    try {
        await env(settingsSystem);
        console.log("Settings saved successfully.")
        event.sender.send("bot-stdout", "Settings saved successfully.\n")
    } catch(err) {
        console.error("Error saving settings:", err)
        event.sender.send("bot-error", String(err))
    }
})

ipcMain.handle("stop-bot", (event) => {
    const c = controllers.get(event.sender.id)
    if (!c) return false
    try {
        c.abortController.abort()
    } catch (e) {}
    controllers.delete(event.sender.id)
    event.sender.send("bot-stdout", "[stopped]\n")
    return true
})

ipcMain.on("bot-stdin", (event, chunk) => {
    // when running in-process we cannot forward stdin to a child process;
    // if CLI supports reading from config or signal, use that. Keep for compatibility.
    event.sender.send("bot-stdout", `[input ignored in in-process mode] ${String(chunk)}\n`)
})

// cleanup on renderer destroy
app.on("web-contents-created", (e, contents) => {
    contents.on("destroyed", () => {
        const child = childMap.get(contents.id)
        if (child && !child.killed) child.kill()
        childMap.delete(contents.id)
    })
})