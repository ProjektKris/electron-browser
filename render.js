const goback = document.getElementById('goback');
const goforward = document.getElementById('goforward');
const reload = document.getElementById('reload');
const urlform = document.getElementById('urlform');
const urlbox = document.getElementById('urlbox');

goback.onclick = () => {
    window.api.send('toMain', ['goback']);
}
goforward.onclick = () => {
    window.api.send('toMain', ['goforward']);
}
reload.onclick = () => {
    window.api.send('toMain', ['reload']);
}
urlform.onsubmit = () => {
    let val = urlbox.value
    window.api.send('toMain', ['url', val]);
}

window.api.receive("fromMain", (data) => {
    console.log(`Received ${data} from main process`);
    switch (data[0]) {
        case 'urlbar:update':
            urlbox.value = data[1];
            break;
    };
});