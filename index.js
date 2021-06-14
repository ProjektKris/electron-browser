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

let win;
let view;
let winSize;
let width;
let height;

app.on('ready', () => {
    console.log('app ready');

    // newWindow();

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

    winSize = win.getSize();
    width = winSize[0];
    height = winSize[1];

    view = new BrowserView()
    win.setBrowserView(view)
    view.setBounds({
        x: 0,
        y: 39,
        width: width - 15,
        height: height - 39 - 55
    })
    view.setBounds({ x: 0, y: 39, width: 780, height: 500 })
    view.webContents.loadURL('https://electronjs.org')

    // set dark theme
    nativeTheme.themeSource = 'dark'

    win.on('resize', () => {
        winSize = win.getSize();
        let width = winSize[0];
        let height = winSize[1];

        view.setBounds({
            x: 0,
            y: 39,
            width: width - 15,
            height: height - 39 - 55
        })
    })

    view.webContents.on('did-finish-load', () => {
        win.webContents.send("fromMain", ['urlbar:update', view.webContents.getURL()]);
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
            view.webContents.goBack();
            break;
        case 'goforward':
            view.webContents.goForward();
            break;
        case 'reload':
            view.webContents.reload();
            break;
        case 'url':
            console.log(`navigate to url: ${data[1]}`)
            view.webContents.loadURL(data[1]);
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
                    view.webContents.toggleDevTools();
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