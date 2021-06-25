const { BrowserView } = require("electron");
export function Tab(url, id, win, onNewTab, onClose) {
  console.log("creating tab");

  // class properties
  this.Id = id;
  this.BrowserView = new BrowserView();
  this.Win = win;

  // methods
  this.Open = () => {
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
    onClose();
  };

  this.BrowserView.webContents.loadURL(url);
  this.Win.webContents.send("fromMain", ["create-tab", this.Win]);

  this.BrowserView.webContents.setWindowOpenHandler(({ newUrl }) => {
    onNewTab(newUrl);
    return { action: "deny" };
  });

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
