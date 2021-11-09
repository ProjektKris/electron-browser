const electron = require("electron");
const path = require("path");
import { Tab } from "./modules/tab";
import { FindEmpty, FindNext, FindPrev, FindLength } from "./modules/find";
import {
    app,
    BrowserWindow,
    BrowserView,
    Menu,
    ipcMain,
    nativeTheme,
    session,
    MenuItem,
} from "electron";

const titlebarHeight = 15;
const bottomExtrasHeight = 56;
const scrollbarWidth = 15;
const startpageURL = "https://www.google.com";

const filter = {
    urls: ["http://*/*", "https://*/*"],
};

let win: BrowserWindow;

let winSize: number[];

let tabs: any[] = [];
let currentTabId: number;

let titleBarEnabled = false;

function createTab(url: string = startpageURL) {
    if (win != null) {
        // determine if it should load the startpage url
        let targetURL: string = url == null ? startpageURL : url;
        let tabId: number = FindEmpty(tabs);
        console.log(tabId);
        // let tabId = tabs.length;

        // create a new tab
        tabs[tabId] = new Tab(targetURL, tabId, win, createTab, () => {
            // onClose
            console.log("onClose");
        });
        currentTabId = tabId;
    }
}

function openTab(id: number) {
    tabs[id].Open();
    currentTabId = id;
}

function closeTab(id: number) {
    console.log(`closing tab: ${id}`);
    if (FindLength(tabs) > 1) {
        tabs[id].Close();
        tabs[id] = null;

        // open existing tab
        if (currentTabId == id) {
            // the tab that was closed was open
            let next = FindNext(tabs, currentTabId);
            openTab(next == null ? FindPrev(tabs, currentTabId) : next);
        } //else if (currentTabId > id) {

        // }

        // let removedTabArr = tabs.splice(id, 1);

        // removedTabArr[0].Close();
        // if (currentTabId == id) {
        //     openTab(tabs.length - 1);
        // }
        // if (currentTabId > id) {
        //     for (let i = 1; i < tabs.length - id; i++) {
        //         tabs[i + id].Id -= 1;
        //     }
        //     currentTabId -= 1;
        // }
    } else {
        app.quit();
    }
}

app.on("ready", () => {
    console.log("app ready");

    // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    //     callback({
    //         responseHeaders: {
    //             ...details.responseHeaders,
    //             "Content-Security-Policy": ["default-src 'self' https:;"],
    //         },
    //     });
    // });

    session.defaultSession.webRequest.onBeforeSendHeaders(
        filter,
        (details, callback) => {
            details.requestHeaders["DNT"] = "1";
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
    );

    // set dark theme
    nativeTheme.themeSource = "dark";

    // In the main process.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
        backgroundColor: "#2a2a2a",
        titleBarStyle: "hidden",
    });

    win.loadFile("./gui/index.html");

    // update BrowserView size
    win.on("resize", () => {
        win.webContents.send("fromMain", ["getHeight"]);
        // winSize = win.getSize();
        // let width = winSize[0];
        // let height = winSize[1];

        // view.setBounds({
        //     x: 0,
        //     y: topHeight,
        //     width: width - scrollbarWidth,
        //     height: height - topHeight - 55
        // })
    });

    win.on("close", () => {
        console.log("clearing session data");
        win.webContents.session.clearStorageData();
        console.log("done!");
    });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

app.on("window-all-closed", () => {
    app.quit();
});

process.on("SIGINT", function () {
    console.log("Caught interrupt signal");
    app.quit();
});

ipcMain.on("toMain", (_: any, data: any[]) => {
    switch (data[0]) {
        // case "navigate":
        //     navigatorWindow.close();
        //     newWindow(data[1]);
        //     break;
        case "goback":
            tabs[currentTabId].GoBack();
            break;
        case "goforward":
            tabs[currentTabId].GoForward();
            break;
        case "reload":
            tabs[currentTabId].Reload();
            break;
        case "url":
            console.log(`navigate to url: ${data[1]}`);
            tabs[currentTabId].LoadURL(data[1]);
            break;
        case "height":
            winSize = win.getSize();
            let width: number = winSize[0];
            let height: number = winSize[1];

            if (!titleBarEnabled) {
                tabs[currentTabId].browserView.setBounds({
                    x: 0,
                    y: data[1], //titlebarHeight + data[1],
                    width: width, // - scrollbarWidth,
                    height: height - data[1], //height - titlebarHeight - bottomExtrasHeight - data[1],
                });
            } else {
                tabs[currentTabId].browserView.setBounds({
                    x: 0,
                    y: titlebarHeight + data[1],
                    width: width - scrollbarWidth,
                    height:
                        height - titlebarHeight - bottomExtrasHeight - data[1],
                });
            }
            break;
        case "newtab":
            createTab();
            break;
        case "closetab":
            closeTab(parseInt(data[1], 10));
            break;
        case "opentab":
            openTab(parseInt(data[1], 10));
            break;
        // case "prevTab":
        //     openTab(parseInt(data[1], 10));
        //     break;
        case "renderjs-ready":
            console.log("renderjs ready");
            createTab();
            break;
        default:
            console.log(`unknown data from window: "${data}"`);
    }
});

const mainMenuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [
            {
                label: "Quit",
                accelerator:
                    process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
                click() {
                    app.quit();
                },
            },
        ],
    },
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
        ],
    },
    // { role: 'viewMenu' }
    {
        label: "View",
        submenu: [
            // { role: "reload" },
            {
                label: "Reload",
                accelerator:
                    process.platform == "darwin" ? "Command+R" : "Ctrl+R",
                click() {
                    tabs[currentTabId].Reload();
                },
            },
            // { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
        ],
    },
    {
        label: "Tabs",
        submenu: [
            {
                label: "New",
                accelerator:
                    process.platform == "darwin" ? "Command+T" : "Ctrl+T",
                click() {
                    createTab();
                },
            },
            {
                label: "Close Tab",
                accelerator:
                    process.platform == "darwin" ? "Command+W" : "Ctrl+W",
                click() {
                    closeTab(currentTabId);
                },
            },
            {
                label: "Previous Tab",
                accelerator: "CommandOrControl+Shift+Tab",
                click() {
                    win.webContents.send("fromMain", ["prevTab"]);
                    // let prev = FindPrev(tabs, currentTabId);
                    // openTab(prev != null ? prev : FindPrev(tabs, tabs.length + 1));
                },
            },
            {
                label: "Next Tab",
                accelerator: "CommandOrControl+Tab",
                click() {
                    win.webContents.send("fromMain", ["nextTab"]);
                    // let next = FindNext(tabs, currentTabId);
                    // openTab(next != null ? next : FindNext(tabs, -1));
                },
            },
            ,
            {
                label: "Focus URLBar",
                accelerator: "CommandOrControl+L",
                click() {
                    win.webContents.focus();
                    win.webContents.send("fromMain", ["urlbar:focus"]);
                },
            },
        ],
    },
    {
        label: "Developer Tools",
        submenu: [
            {
                label: "Toggle DevTools",
                accelerator:
                    process.platform == "darwin" ? "Command+I" : "Ctrl+I",
                click(_item: MenuItem, _focusedWindow: BrowserWindow) {
                    tabs[currentTabId].browserView.webContents.toggleDevTools();
                    // focusedWindow.toggleDevTools();
                },
            },
            {
                label: "Browser UI DevTools",
                accelerator:
                    process.platform == "darwin"
                        ? "Command+Alt+Shift+I"
                        : "Ctrl+Alt+Shift+I",
                click(_item: MenuItem, focusedWindow: BrowserWindow) {
                    // tabs[currentTabId].webContents.toggleDevTools();
                    focusedWindow.webContents.toggleDevTools();
                },
            },
        ],
    },
];

// yup menubar for mac doms
// if (process.platform == "darwin") {
//     mainMenuTemplate.unshift({});
// }

// add dev tools if not production
// if (process.env.NODE_ENV != "production") {
//     mainMenuTemplate.push({
//         label: 'Developer Tools',
//         submenu: [
//             {
//                 label: 'Toggle DevTools',
//                 accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
//                 click(item, focusedWindow) {
//                     focusedWindow.toggleDevTools();
//                 }
//             },
//             {
//                 role: 'reload'
//             }
//         ]
//     })
// }
