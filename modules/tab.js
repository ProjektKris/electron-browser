const { BrowserView } = require("electron");

function Tab(url, id, win, onNewTab, onClose) {
    console.log("creating tab");

    // class properties
    this.Id = id;
    this.BrowserView = new BrowserView();
    this.Win = win;

    // methods
    this.Open = () => {
        // opens this tab
        // show the browserview
        this.Win.setBrowserView(this.BrowserView);

        // highlight the tab button
        this.Win.webContents.send("fromMain", ["highlight-tab", this.Id]);

        // readjust webcontent bounds
        this.Win.webContents.send("fromMain", ["getHeight"]);

        // update urlbox
        console.log(`current tab id: ${this.Id}`);
        this.Win.webContents.send("fromMain", [
            "urlbar:update",
            this.BrowserView.webContents.getURL(),
        ]);

        // update tab title
        this.Win.webContents.send("fromMain", [
            "update-tab-title",
            this.Id,
            this.BrowserView.webContents.getTitle(),
        ]);

        // update window title
        this.Win.title = this.BrowserView.webContents.getTitle();
    };
    this.Close = () => {
        // closes this tab (not hide)
        onClose(); // remove this tab from index?
        this.Win.webContents.send("fromMain", ["remove-tab", this.Id]);

        this.BrowserView.webContents.removeAllListeners();
        this.BrowserView.webContents.delete();
        this.BrowserView.webContents.forcefullyCrashRenderer();
    };
    this.LoadURL = (urlToLoad) => {
        this.BrowserView.webContents.loadURL(urlToLoad);
    };
    this.Reload = () => {
        this.BrowserView.webContents.reload();
    };
    this.GoForward = () => {
        this.BrowserView.webContents.goForward();
    };
    this.GoBack = () => {
        this.BrowserView.webContents.goBack();
    };

    // load url
    this.LoadURL(url);

    // render tab button
    this.Win.webContents.send("fromMain", ["create-tab", this.Id]);

    // open link in new tab instead of new window
    this.BrowserView.webContents.setWindowOpenHandler(({ url }) => {
        onNewTab(url);
        return { action: "deny" };
    });

    // open this tab
    this.Open();

    // set bounds
    this.BrowserView.webContents.once("dom-ready", () => {
        this.Win.webContents.send("fromMain", ["getHeight"]);
    });

    // update url box
    this.BrowserView.webContents.on("did-finish-load", () => {
        this.Win.webContents.send("fromMain", [
            "urlbar:update",
            this.BrowserView.webContents.getURL(),
        ]);
    });

    // update tab title
    this.BrowserView.webContents.on("page-title-updated", (_, title) => {
        if (this.Win.getBrowserView() == this.BrowserView) {
            // update tab title
            this.Win.webContents.send("fromMain", [
                "update-tab-title",
                this.Id,
                title,
            ]);

            // update window title
            this.Win.title = this.BrowserView.webContents.getTitle();
        }
    });
}

module.exports = Tab;
