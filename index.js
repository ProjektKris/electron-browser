const electron = require("electron");
const path = require("path");
const Tab = require("./modules/tab");
const { FindEmpty, FindNext } = require("./modules/find");
const { app, BrowserWindow, BrowserView, Menu, ipcMain, nativeTheme, session } =
    electron;

const titlebarHeight = 15;
const bottomExtrasHeight = 56;
const scrollbarWidth = 15;
const startpageURL = "https://www.google.com";

const filter = {
    urls: ["http://*/*", "https://*/*"],
};

let win;
let view;

let winSize;

let tabs = [];
let currentTabId;

function createTab(url) {
    if (win != null) {
        // determine if it should load the startpage url
        let targetURL = url == null ? startpageURL : url;
        let tabId = FindEmpty(tabs);
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

function openTab(id) {
    tabs[id].Open();
    currentTabId = id;
}

function closeTab(id) {
    console.log(`closing tab: ${id}`);
    if (tabs.length > 1) {
        tabs[id].Close();
        tabs[id] = null;

        // open existing tab
        if (currentTabId == id) {
            // the tab that was closed was open
            openTab(FindNext(tabs, currentTabId));
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

    session.defaultSession.webRequest.onBeforeSendHeaders(
        filter,
        (details, callback) => {
            details.requestHeaders["DNT"] = "1";
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
    );

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
    });
    win.loadFile("index.html");

    // set dark theme
    nativeTheme.themeSource = "dark";

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
        win.webContents.session.clearStorageData([]);
        console.log("done!");
    });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("toMain", (_, data) => {
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
            let width = winSize[0];
            let height = winSize[1];

            tabs[currentTabId].BrowserView.setBounds({
                x: 0,
                y: titlebarHeight + data[1],
                width: width - scrollbarWidth,
                height: height - titlebarHeight - bottomExtrasHeight - data[1],
            });
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
        case "renderjs-ready":
            console.log("renderjs ready");
            createTab();
            break;
        default:
            console.log(`unknown data from window: "${data}"`);
    }
});

const mainMenuTemplate = [
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
            { role: "reload" },
            { role: "forceReload" },
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
                    let tabIdToOpen = 0;
                    if (currentTabId > 0) {
                        tabIdToOpen = currentTabId - 1;
                    } else {
                        tabIdToOpen = tabs.length - 1;
                    }
                    openTab(tabIdToOpen);
                },
            },
            {
                label: "Next Tab",
                accelerator: "CommandOrControl+Tab",
                click() {
                    let tabIdToOpen = 0;
                    if (currentTabId < tabs.length - 1) {
                        tabIdToOpen = currentTabId + 1;
                    }
                    openTab(tabIdToOpen);
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
                click(item, focusedWindow) {
                    tabs[currentTabId].webContents.toggleDevTools();
                    // focusedWindow.toggleDevTools();
                },
            },
            {
                label: "Browser UI DevTools",
                // accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    // tabs[currentTabId].webContents.toggleDevTools();
                    focusedWindow.toggleDevTools();
                },
            },
        ],
    },
];

// yup menubar for mac doms
if (process.platform == "darwin") {
    mainMenuTemplate.unshift({});
}

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
