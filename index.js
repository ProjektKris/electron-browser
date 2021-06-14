const electron = require('electron');
const path = require('path');
const {
    app,
    BrowserWindow,
    BrowserView,
    Menu,
    ipcMain,
    nativeTheme
} = electron;

const titlebarHeight = 15;
const bottomExtrasHeight = 56;
const scrollbarWidth = 15;
const startpageURL = 'https://www.google.com';

let win;
let view;

let winSize;

let tabs = [];
let currentTabId;

function createTab(url) {
    if (win != null) {
        // determine if it should load the startpage url
        let targetURL = url == null ? startpageURL : url;

        // create a new tab
        let newTab = new BrowserView()

        // load url
        newTab.webContents.loadURL(targetURL);

        // index
        tabs.push(newTab);
        openTab(tabs.length-1);

        // set bounds
        newTab.webContents.once('dom-ready', () => {
            win.webContents.send('fromMain', ['getHeight']);
        });
        
        // update url box
        newTab.webContents.on('did-finish-load', () => {
            win.webContents.send("fromMain", ['urlbar:update', newTab.webContents.getURL()]);
        })
    }
}

function openTab(id) {
    if (currentTabId != null) {
        if (currentTabId != id) {
            // hide prev tab
            win.removeBrowserView(tabs[currentTabId]);

            // update currentTabId
            currentTabId = id;

            // update browserview
            win.setBrowserView(tabs[currentTabId]);
        }
    } else {
        currentTabId = 0;
        win.setBrowserView(tabs[currentTabId]);
    }
}

function closeTab(id) {
    if (tabs.length > 1) {
        tabs.splice(id, 1);
        if (currentTabId == id) {
            if (currentTabId > 1) {
                openTab(currentTabId - 1);
            } else {
                openTab(currentTabId + 1);
            }
        }
        if (currentTabId > id) {
            currentTabId += 1;
        }
    } else {
        app.quit();
    }
}

app.on('ready', () => {
    console.log('app ready');

    // In the main process.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: "#2a2a2a"
    })
    win.loadFile('index.html');

    createTab();

    // set dark theme
    nativeTheme.themeSource = 'dark';

    // update BrowserView size
    win.on('resize', () => {
        win.webContents.send('fromMain', ['getHeight']);
        // winSize = win.getSize();
        // let width = winSize[0];
        // let height = winSize[1];

        // view.setBounds({
        //     x: 0,
        //     y: topHeight,
        //     width: width - scrollbarWidth,
        //     height: height - topHeight - 55
        // })
    })



    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
})

app.on('window-all-closed', () => {
    app.quit();
})

ipcMain.on('toMain', (_, data) => {
    switch (data[0]) {
        case "navigate":
            navigatorWindow.close();
            newWindow(data[1]);
            break;
        case "goback":
            tabs[currentTabId].webContents.goBack();
            break;
        case 'goforward':
            tabs[currentTabId].webContents.goForward();
            break;
        case 'reload':
            tabs[currentTabId].webContents.reload();
            break;
        case 'url':
            console.log(`navigate to url: ${data[1]}`)
            tabs[currentTabId].webContents.loadURL(data[1]);
            break;
        case 'height':
            winSize = win.getSize();
            let width = winSize[0];
            let height = winSize[1];

            tabs[currentTabId].setBounds({
                x: 0,
                y: titlebarHeight + data[1],
                width: width - scrollbarWidth,
                height: height - titlebarHeight - bottomExtrasHeight - data[1]
            })
            break;
        default:
            console.log(`unknown data from window: "${data}"`);
    };
})

const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' }
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Tabs',
        submenu: [
            {
                label: 'New',
                accelerator: process.platform == 'darwin' ? 'Command+T' : 'Ctrl+T',
                click() {
                    openNav();
                }
            }
        ]
    },
    {
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    tabs[currentTabId].webContents.toggleDevTools();
                    // focusedWindow.toggleDevTools();
                }
            }
        ]
    }
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