const body = document.querySelector("body");
const goback = document.getElementById("goback");
const goforward = document.getElementById("goforward");
const reload = document.getElementById("reload");
const urlform = document.getElementById("urlform");
const urlbox: HTMLInputElement = <HTMLInputElement>(
    document.getElementById("urlbox")
);
const tabsContainer = document.getElementById("tabs");
const newTab = document.getElementById("btn-newtab");

let highlightedTabElement: HTMLElement;

// make the tabs container a drag container
// makeDragContainer(tabsContainer);

interface Window {
    api: any;
}

goback.onclick = () => {
    window.api.send("toMain", ["goback"]);
};
goforward.onclick = () => {
    window.api.send("toMain", ["goforward"]);
};
reload.onclick = () => {
    window.api.send("toMain", ["reload"]);
};
urlform.onsubmit = (e) => {
    e.preventDefault();
    let val = urlbox.value;
    window.api.send("toMain", ["url", val]);
};

newTab.onclick = () => {
    window.api.send("toMain", ["newtab"]);
};

window.api.receive("fromMain", (data: any[]) => {
    console.log(`Received ${data} from main process`);
    switch (data[0]) {
        case "urlbar:update":
            urlbox.value = data[1];
            break;
        case "getHeight":
            window.api.send("toMain", [
                "height",
                body.clientHeight +
                    parseInt(window.getComputedStyle(body).marginTop) * 2,
            ]);
            break;
        case "create-tab":
            // <div id="tabs" class="flex-container">
            //         <button class="tab">
            //             <p>tab1</p>
            //             <button>x</button>
            //         </button>
            //     </div>
            let newTabDiv = document.createElement("div");
            let newTabBtn = document.createElement("button");
            let newCloseBtn = document.createElement("button");

            tabsContainer.appendChild(newTabDiv);
            newTabDiv.appendChild(newTabBtn);
            newTabDiv.appendChild(newCloseBtn);

            newTabDiv.className = "tab";
            newTabDiv.id = `tab${data[1].toString()}`;
            newTabBtn.innerHTML = `tab ${data[1].toString()}`;
            newTabBtn.id = `tabBtn${data[1].toString()}`;
            newCloseBtn.innerHTML = "x";

            // dragging
            makeDraggable(newTabDiv);
            listenForTabDrag(newTabDiv);

            newTabBtn.onclick = () => {
                let elementId = newTabDiv.id;
                let res = elementId.split("tab");
                let tabId = res[1];
                window.api.send("toMain", ["opentab", tabId]);
            };
            newTabDiv.onauxclick = (e) => {
                let elementId = newTabDiv.id;
                let res = elementId.split("tab");
                let tabId = res[1];
                if (e.button == 1) {
                    // middle mouse button close tab
                    window.api.send("toMain", ["closetab", tabId]);
                }
            };
            newCloseBtn.onclick = () => {
                let elementId = newTabDiv.id;
                let res = elementId.split("tab");
                let tabId = res[1];
                window.api.send("toMain", ["closetab", tabId]);
            };
            break;
        case "highlight-tab":
            if (highlightedTabElement != null) {
                highlightedTabElement.className = "tab";
            }
            let tabBtn = document.getElementById(`tab${data[1].toString()}`);
            tabBtn.className = "tab selected-tab";
            highlightedTabElement = tabBtn;
            break;
        case "remove-tab":
            let removedTabId = data[1];
            let tabElement: Element;
            for (tabElement of document.querySelectorAll(".tab")) {
                console.log(`real: ${tabElement}`);
                let elementId = tabElement.id;
                let res = elementId.split("tab");
                let tabId = res[1];
                let tabBtn = document.getElementById(`tabBtn${tabId}`);
                if (tabId == removedTabId) {
                    tabElement.remove();
                } else {
                    if (tabId > removedTabId) {
                        // tabElement.id = `tab${tabId - 1}`;
                        // tabBtn.id = `tabBtn${tabId - 1}`;
                        // tabBtn.innerHTML = `tab ${tabId-1}`
                    }
                }
            }
            break;
        case "update-tab-title":
            let tabId = data[1];
            let title = data[2];
            let tabBtnToRetitle = document.getElementById(`tabBtn${tabId}`);

            tabBtnToRetitle.innerHTML = title;
            break;
        case "prevTab":
            const tabDivs = document.querySelectorAll(".tab");
            let currentTabIndex = 0;

            // find currentTabIndex
            for (let i = 0; i < tabDivs.length; i++) {
                let tabElement = tabDivs[i];
                if (tabElement.classList.contains("selected-tab")) {
                    currentTabIndex = i;
                    break;
                }
            }

            let prevTabIndex =
                currentTabIndex > 0 ? currentTabIndex - 1 : tabDivs.length - 1;
            console.log(prevTabIndex);
            let prevTabId = tabDivs[prevTabIndex].id;

            window.api.send("toMain", ["opentab", prevTabId.slice(3)]);
            break;
        case "nextTab":
            const tabDivs1 = document.querySelectorAll(".tab");
            let currentTabIndex1 = 0;

            // find currentTabIndex1
            for (let i = 0; i < tabDivs1.length; i++) {
                let tabElement = tabDivs1[i];
                if (tabElement.classList.contains("selected-tab")) {
                    currentTabIndex1 = i;
                    break;
                }
            }

            let nextTabIndex =
                currentTabIndex1 < tabDivs1.length - 1
                    ? currentTabIndex1 + 1
                    : 0;
            console.log(nextTabIndex);
            let nextTabId = tabDivs1[nextTabIndex].id;

            window.api.send("toMain", ["opentab", nextTabId.slice(3)]);
            break;
    }
});

function makeDraggable(element: HTMLElement) {
    element.draggable = true;
    element.addEventListener("dragstart", () => {
        element.classList.add("dragging");
    });
    element.addEventListener("dragend", () => {
        element.classList.remove("dragging");
    });
}

function insertAfter(newNode: Node, referenceNode: Node) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function listenForTabDrag(element: HTMLElement) {
    element.addEventListener("dragover", (e) => {
        const draggingElements = [
            ...tabsContainer.querySelectorAll(".dragging"),
        ];
        const draggingElement = draggingElements[0];
        let elementBound = element.getBoundingClientRect();
        let right = elementBound.right;
        let left = elementBound.left;
        let dist = right - left;
        let center = left + dist / 2;
        if (e.clientX < center) {
            if (element.previousSibling != draggingElement) {
                tabsContainer.insertBefore(draggingElement, element);
            }
        } else {
            if (element.nextSibling != draggingElement) {
                insertAfter(draggingElement, element);
            }
        }
        // console.log(e, element);
        // if (element != draggingElement) {
        // }
    });
}

window.api.send("toMain", ["renderjs-ready"]);
