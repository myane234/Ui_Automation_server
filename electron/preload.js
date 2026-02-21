const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
    startBot: (config) => ipcRenderer.invoke("start-bot", config),
    onExit: (cb) => ipcRenderer.on("bot-exit", (e, code) => cb(code)),
    onError: (cb) => ipcRenderer.on("bot-error", (e, err) => cb(err)),
    onStdout: (cb) => ipcRenderer.on("bot-stdout", (e, d) => cb(d)),
    onStderr: (cb) => ipcRenderer.on("bot-stderr", (e, d) => cb(d))
})