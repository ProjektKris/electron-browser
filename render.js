const body = document.querySelector('body');
const goback = document.getElementById('goback');
const goforward = document.getElementById('goforward');
const reload = document.getElementById('reload');
const urlform = document.getElementById('urlform');
const urlbox = document.getElementById('urlbox');
const tabsContainer = document.getElementById('tabs');
const newTab = document.getElementById('btn-newtab');

let highlightedTabElement;

goback.onclick = () => {
    window.api.send('toMain', ['goback']);
}
goforward.onclick = () => {
    window.api.send('toMain', ['goforward']);
}
reload.onclick = () => {
    window.api.send('toMain', ['reload']);
}
urlform.onsubmit = (e) => {
    e.preventDefault();
    let val = urlbox.value
    window.api.send('toMain', ['url', val]);
}

newTab.onclick = () => {
    window.api.send('toMain', ['newtab']);
}

window.api.receive("fromMain", (data) => {
    console.log(`Received ${data} from main process`);
    switch (data[0]) {
        case 'urlbar:update':
            urlbox.value = data[1];
            break;
        case 'getHeight':
            window.api.send('toMain', ['height', body.clientHeight]);
            break;
        case 'create-tab':
            // <div id="tabs" class="flex-container">
            //         <button class="tab">
            //             <p>tab1</p>
            //             <button>x</button>
            //         </button>
            //     </div>
            let newTabDiv = document.createElement('div');
            let newTabBtn = document.createElement('button');
            let newCloseBtn = document.createElement("button")

            tabsContainer.appendChild(newTabDiv);
            newTabDiv.appendChild(newTabBtn);
            newTabDiv.appendChild(newCloseBtn);

            newTabDiv.className = 'tab';
            newTabDiv.id = `tab${data[1].toString()}`
            newTabBtn.innerHTML = `tab ${data[1].toString()}`;
            newTabBtn.id = `tabBtn${data[1].toString()}`
            newCloseBtn.innerHTML = 'x';

            newTabBtn.onclick = () => {
                let elementId = newTabDiv.id;
                let res = elementId.split('tab');
                let tabId = res[1];
                window.api.send('toMain', ['opentab', tabId])
            }
            newCloseBtn.onclick = () => {
                let elementId = newTabDiv.id;
                let res = elementId.split('tab');
                let tabId = res[1];
                window.api.send('toMain', ['closetab', tabId])

            }
            break;
        case 'highlight-tab':
            if (highlightedTabElement != null) {
                highlightedTabElement.className = 'tab';
            }
            let tabBtn = document.getElementById(`tab${data[1].toString()}`);
            tabBtn.className = 'tab selected-tab';
            highlightedTabElement = tabBtn;
            break;
        case 'remove-tab':
            let removedTabId = data[1];
            for (tabElement of document.querySelectorAll(".tab")) {
                console.log(`real: ${tabElement}`)
                let elementId = tabElement.id;
                let res = elementId.split('tab');
                let tabId = res[1];
                let tabBtn = document.getElementById(`tabBtn${tabId}`)
                if (tabId == removedTabId) {
                    tabElement.remove();
                } else {
                    if (tabId > removedTabId) {
                        tabElement.id = `tab${tabId - 1}`;
                        tabBtn.id = `tabBtn${tabId - 1}`;
                        // tabBtn.innerHTML = `tab ${tabId-1}`
                    }
                }
            }
            break;
        case 'update-tab-title':
            let tabId = data[1];
            let title = data[2];
            let tabBtnToRetitle = document.getElementById(`tabBtn${tabId}`);

            tabBtnToRetitle.innerHTML = title;
            break;
    };
});

window.api.send('toMain', ['renderjs-ready']);