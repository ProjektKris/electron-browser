const electron = require('electron');
const path = require('path');
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain
} = electron;

// let windows = [];
let navigatorWindow;

function openNav() {
    if (navigatorWindow == null) {
        // create new window
        navigatorWindow = new BrowserWindow({
            width: 250,
            height: 200,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        navigatorWindow.loadFile('navigator.html');

        navigatorWindow.on("close", () => {
            navigatorWindow = null
        })
    }
}

function newWindow(url) {
    // create new window
    let window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    window.loadURL(url != '' && url != null && url != 'https://' ? url : 'https://www.google.com');
    // let newPromise = new Promise((resolve, reject) => {
    //     windows[windows.length] = new BrowserWindow({
    //         width: 800,
    //         height: 600,
    //         webPreferences: {
    //             nodeIntegration: false,
    //             contextIsolation: true,
    //             preload: path.join(__dirname, 'preload.js')
    //         }
    //     });
    //     resolve();
    //     reject();
    // })

    // newPromise.then(
    //     () => {
    //         console.log(url);
    //         if (url == '' || url == null) {
    //             console.log(windows[windows.length])
    //             windows[windows.length].loadURL('https://www.google.com');
    //         } else {
    //             windows[windows.length].loadURL(url);
    //         }
    //     },
    //     (err) => {
    //         console.log(err);
    //     }
    // )
}

app.on('ready', () => {
    console.log('app ready');

    newWindow();

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
        default:
            console.log("unknown data from window")
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
                    focusedWindow.toggleDevTools();
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