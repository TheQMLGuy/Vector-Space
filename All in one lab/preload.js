const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Add more IPC methods as needed
    onMessage: (callback) => ipcRenderer.on('message', callback),
    sendMessage: (channel, data) => ipcRenderer.send(channel, data)
});

// Expose version info
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});
