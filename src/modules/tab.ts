import { BrowserView, BrowserWindow } from "electron";

export class Tab {
    id: number;
    browserView: BrowserView;
    win: BrowserWindow;
    onClose: any;

    constructor(
        url: string,
        id: number,
        win: BrowserWindow,
        onNewTab: any,
        onClose: any
    ) {
        console.log("creating tab");

        // class properties
        this.id = id;
        this.browserView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
            },
        });
        this.win = win;
        this.onClose = onClose;

        // load url
        this.LoadURL(url);

        // render tab button
        this.win.webContents.send("fromMain", ["create-tab", this.id]);

        // open link in new tab instead of new window
        this.browserView.webContents.setWindowOpenHandler(
            ({ url }: { url: string }) => {
                onNewTab(url);
                return { action: "deny" };
            }
        );

        // open this tab
        this.Open();

        // set bounds
        this.browserView.webContents.once("dom-ready", () => {
            this.win.webContents.send("fromMain", ["getHeight"]);
        });

        // update tab title
        this.browserView.webContents.on(
            "page-title-updated",
            (_: any, title: string) => {
                // update tab title
                this.win.webContents.send("fromMain", [
                    "update-tab-title",
                    this.id,
                    title,
                ]);

                if (this.win.getBrowserView() == this.browserView) {
                    // update window title
                    this.win.title = this.browserView.webContents.getTitle();

                    // readjust webcontent bounds
                    this.win.webContents.send("fromMain", ["getHeight"]);
                }
            }
        );

        this.browserView.webContents.session.setPermissionRequestHandler(
            (webContents, permission, callback) => {
                const url = webContents.getURL();

                // reject all permission request for now until i make a permission request ui
                return callback(false);
            }
        );
    }

    Open() {
        // opens this tab
        // show the browserview
        this.win.setBrowserView(this.browserView);

        // highlight the tab button
        this.win.webContents.send("fromMain", ["highlight-tab", this.id]);

        // update urlbox
        console.log(`current tab id: ${this.id}`);
        this.win.webContents.send("fromMain", [
            "urlbar:update",
            this.browserView.webContents.getURL(),
        ]);

        // update tab title
        this.win.webContents.send("fromMain", [
            "update-tab-title",
            this.id,
            this.browserView.webContents.getTitle(),
        ]);

        // readjust webcontent bounds
        this.win.webContents.send("fromMain", ["getHeight"]);

        // update window title
        this.win.title = this.browserView.webContents.getTitle();
    }

    Close() {
        // closes this tab (not hide)
        this.onClose(); // remove this tab from index?
        this.win.webContents.send("fromMain", ["remove-tab", this.id]);

        this.browserView.webContents.removeAllListeners();
        this.browserView.webContents.delete();
        this.browserView.webContents.forcefullyCrashRenderer();
    }

    LoadURL(urlToLoad: string) {
        this.browserView.webContents.loadURL(urlToLoad);
    }

    Reload() {
        this.browserView.webContents.reload();
    }

    GoForward() {
        this.browserView.webContents.goForward();
    }

    GoBack() {
        this.browserView.webContents.goBack();
    }
}

// function Tab(
//     url: string,
//     id: number,
//     win: typeof BrowserWindow,
//     onNewTab: any,
//     onClose: any
// ) {
//     console.log("creating tab");

//     // class properties
//     this.id = id;
//     this.browserView = new BrowserView();
//     this.win = win;

//     // methods
//     this.Open = () => {
//         // opens this tab
//         // show the browserview
//         this.win.setBrowserView(this.browserView);

//         // highlight the tab button
//         this.win.webContents.send("fromMain", ["highlight-tab", this.id]);

//         // update urlbox
//         console.log(`current tab id: ${this.id}`);
//         this.win.webContents.send("fromMain", [
//             "urlbar:update",
//             this.browserView.webContents.getURL(),
//         ]);

//         // update tab title
//         this.win.webContents.send("fromMain", [
//             "update-tab-title",
//             this.id,
//             this.browserView.webContents.getTitle(),
//         ]);

//         // readjust webcontent bounds
//         this.win.webContents.send("fromMain", ["getHeight"]);

//         // update window title
//         this.win.title = this.browserView.webContents.getTitle();
//     };
//     this.Close = () => {
//         // closes this tab (not hide)
//         onClose(); // remove this tab from index?
//         this.win.webContents.send("fromMain", ["remove-tab", this.id]);

//         this.browserView.webContents.removeAllListeners();
//         this.browserView.webContents.delete();
//         this.browserView.webContents.forcefullyCrashRenderer();
//     };
//     this.LoadURL = (urlToLoad: string) => {
//         this.browserView.webContents.loadURL(urlToLoad);
//     };
//     this.Reload = () => {
//         this.browserView.webContents.reload();
//     };
//     this.GoForward = () => {
//         this.browserView.webContents.goForward();
//     };
//     this.GoBack = () => {
//         this.browserView.webContents.goBack();
//     };

//     // load url
//     this.LoadURL(url);

//     // render tab button
//     this.win.webContents.send("fromMain", ["create-tab", this.id]);

//     // open link in new tab instead of new window
//     this.browserView.webContents.setWindowOpenHandler(
//         ({ url }: { url: string }) => {
//             onNewTab(url);
//             return { action: "deny" };
//         }
//     );

//     // open this tab
//     this.Open();

//     // set bounds
//     this.browserView.webContents.once("dom-ready", () => {
//         this.win.webContents.send("fromMain", ["getHeight"]);
//     });

//     // update url box
//     this.browserView.webContents.on("did-finish-load", () => {
//         this.win.webContents.send("fromMain", [
//             "urlbar:update",
//             this.browserView.webContents.getURL(),
//         ]);
//     });

//     // update tab title
//     this.browserView.webContents.on(
//         "page-title-updated",
//         (_: any, title: string) => {
//             if (this.win.getBrowserView() == this.browserView) {
//                 // update tab title
//                 this.win.webContents.send("fromMain", [
//                     "update-tab-title",
//                     this.id,
//                     title,
//                 ]);

//                 // update window title
//                 this.win.title = this.browserView.webContents.getTitle();

//                 // readjust webcontent bounds
//                 this.win.webContents.send("fromMain", ["getHeight"]);
//             }
//         }
//     );
// }

// module.exports = Tab;
