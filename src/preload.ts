// source: https://github.com/reZach/secure-electron-template/blob/master/docs/newtoelectron.md

import { contextBridge, ipcRenderer } from "electron";

// const {
//     contextBridge,
//     ipcRenderer
// } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
    send: (channel: any, data: any[]) => {
        // whitelist channels
        let validChannels = ["toMain"];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: any, func: any) => {
        let validChannels = ["fromMain"];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event: any, ...args: any[]) =>
                func(...args)
            );
        }
    },
});
