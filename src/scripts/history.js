import browser from 'webextension-polyfill';
import QRCode from 'qrcode';

// on page load
document.addEventListener('DOMContentLoaded', () => {
    let updatedHTML;
    const html = '<tr class="table__body--holder" id="table__body-%num%"><td class="table__body--original"><a href="%longLink%" class="table__body--originalURL" target="_blank" rel="noopener">%longLink%</a></td><td class="table__body--shortened" id="table__shortened-%num%"><div class="table__body--shortenBody"><a href="%shortLink%" id="shortUrl-%num%" class="table__body--shortenURL" target="_blank" rel="noopener">%shortLink%</a></div></td><td class="table__body--functionBtns"><div class="table__body--btnHolder" id="btns-%num%"><button type="button" class="table__body--copy" id="copy-%num%" title="Copy"><img class="selectDisable icon__img" src="assets/copy.svg" alt="copy" /></button><button type="button" class="table__body--qrcode" id="qrcode-%num%" title="QR Code"><img class="selectDisable icon__img" src="assets/qrcode.svg" alt="QR Code" /></button></div></td></tr>';
    // get longURL, shortURL
    browser.storage.local.get(['URL_array'])
        .then(result => {
            const count = result.URL_array.length;
            // update DOM
            if (count > 0) {
                let pass = 0;
                for (let el of result.URL_array) {
                    // Regular Expression Based Implementation
                    updatedHTML = html.replace(/%longLink%/g, el.longUrl);
                    updatedHTML = updatedHTML.replace(/%num%/g, ++pass);
                    updatedHTML = updatedHTML.replace(/%shortLink%/g, el.shortUrl);
                    // inject to DOM
                    document.getElementById('delegation__element').insertAdjacentHTML('afterbegin', updatedHTML);
                }
            }
        })
        .catch(err => {
            // console.log('localstorage_warning : Failed to Fetch.');
            alert('Enable History from Options Page');
            // open options page
            browser.runtime.openOptionsPage();
        });
});


// Clear all history
document.getElementById('table__clearAll--btn').addEventListener('click', () => {
    browser.storage.local.set({ URL_array: [] })
        .then(() => {
            const el = document.getElementById('delegation__element');
            el.parentNode.removeChild(el);
        });
    // .catch(err => {
    //     console.log('localstorage_warning: Failed to Fetch.');
    // });
});


function buttonAction(type, id) {
    function flashCopy(flashHTML) {
        document.getElementById(`table__shortened-${id}`).insertAdjacentHTML('afterbegin', flashHTML);
        setTimeout(() => {
            const el = document.getElementById('flash_copy');
            el.parentNode.removeChild(el);
        }, 1300);
    }
    if (type === 'copy') {
        // copy button
        // 1. get url
        const shortLink = document.getElementById(`shortUrl-${id}`).textContent;
        // 2, add to clipboard
        try {
            const copyTextarea = shortLink;
            const input = document.createElement('textarea');
            document.body.appendChild(input);
            input.value = copyTextarea;
            input.focus();
            input.select();
            document.execCommand('copy');
            input.remove();
            const flashHTML = '<div class="table_body--flashCopy" id="flash_copy">Copied to clipboard!</div>';
            flashCopy(flashHTML);
        }
        catch (error) {
            const flashHTML = '<div class="table_body--flashCopy" id="flash_copy">Error while Copying!!</div>';
            flashCopy(flashHTML);
        }
    }
    else if (type === 'qrcode') {
        // inject template
        let updatedHTML;
        const html = '<div class="table__qrcodePopup--div" id="qrcode__template"><div class="table__qrcode--popup"><div class="table__qrcode--holder"><img id="table__qrcode" src="%qrcodeLink%" alt="QRCode" /></div><div class="table__closebtn--holder"><button type="button" class="table__closebtn--inner" id="close__btn-%num%">Close</button></div></div></div>';
        // 1. get short link
        const shortUrl = document.getElementById(`shortUrl-${id}`).textContent;
        // 2. generate qrcode
        QRCode.toDataURL(shortUrl)
            .then(qrcodeURL => {
                // 3. display popup menu with link
                updatedHTML = html.replace('%qrcodeLink%', qrcodeURL);
                updatedHTML = updatedHTML.replace('%num%', id);
                document.getElementById(`btns-${id}`).insertAdjacentHTML('afterend', updatedHTML);
            })
            .catch(err => {
                // fetch qrcode from http://goqr.me
                const qrcode__src = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=';
                updatedHTML = html.replace('%qrcodeLink%', `${qrcode__src}${shortUrl}`);
                document.getElementById(`btns-${id}`).insertAdjacentHTML('afterend', updatedHTML);
            });
    }
    else if (type === 'close__btn') {
        const el = document.getElementById('qrcode__template');
        el.parentNode.removeChild(el);
    }
}


// get the delegation id
function getButtonDetails(e) {
    let splitId, type, id;
    const eventId = e.target.id;
    if (eventId) {
        splitId = eventId.split('-');
        type = splitId[0];
        id = parseInt(splitId[1]);
        buttonAction(type, id);
    }
}


// Button Action (qrcode / copy)
document.getElementById('delegation__element').addEventListener('click', getButtonDetails);


// prevent enter key press
document.addEventListener('keypress', (e) => {
    const keyCode = e.which || e.keyCode;
    // enter key
    if (keyCode === 13) {
        e.preventDefault();
    }
});