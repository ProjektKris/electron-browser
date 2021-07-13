const body = document.querySelector("body");
const goback = document.getElementById("goback");
const goforward = document.getElementById("goforward");
const reload = document.getElementById("reload");
const urlform = document.getElementById("urlform");
const urlbox = document.getElementById("urlbox");
const tabsContainer = document.getElementById("tabs");
const newTab = document.getElementById("btn-newtab");

let highlightedTabElement;

// make the tabs container a drag container
// makeDragContainer(tabsContainer);

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

window.api.receive("fromMain", (data) => {
    console.log(`Received ${data} from main process`);
    switch (data[0]) {
        case "urlbar:update":
            urlbox.value = data[1];
            break;
        case "getHeight":
            window.api.send("toMain", ["height", body.clientHeight]);
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

            window.api.send("toMain", ["prevTab", prevTabId.slice(3)]);
            break;
        case "nextTab":
            const tabDivs1 = document.querySelectorAll(".tab");
            let currentTabIndex1 = 0;

            // find currentTabIndex1
            for (let i = 0; i < tabDivs1.length; i++) {
                tabElement = tabDivs1[i];
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

            window.api.send("toMain", ["prevTab", nextTabId.slice(3)]);
            break;
    }
});

function makeDraggable(element) {
    element.draggable = true;
    element.addEventListener("dragstart", () => {
        element.classList.add("dragging");
    });
    element.addEventListener("dragend", () => {
        element.classList.remove("dragging");
    });
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function listenForTabDrag(element) {
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

// function makeDragContainer(container) {
//     container.addEventListener('dragover', e => {
//         e.preventDefault();
//         var x = e.clientX, y = e.clientY,
//             elementMouseIsOver = document.elementFromPoint(x, y);

//         console.log(elementMouseIsOver);
//         // const afterElement = getDragAfterElement(container, e.clientX);
//         // const dragable = document.querySelector(".dragging");
//         // if (afterElement == null) {
//         //     container.appendChild(dragable);
//         // } else {
//         //     container.insertBefore(dragable, afterElement);
//         // }
//     });
// }

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll(".tab")]; //('.tab:not(.dragging)')];

    return draggableElements.reduce(
        (closest, child) => {
            console.log(closest);
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.right / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

window.api.send("toMain", ["renderjs-ready"]);
