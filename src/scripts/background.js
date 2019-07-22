import axios from 'axios';
import browser from 'webextension-polyfill';

// Shorten url
const shortenUrl = async (API_KEY, urlToShorten, password) => {
    let API_HOST = 'https://link.sun-asterisk.vn';

    try {
        const { host, userOptions } = await browser.storage.local.get(['host', 'userOptions']);
        // eslint-disable-next-line no-prototype-builtins
        if (userOptions.hasOwnProperty('devMode') && userOptions.devMode) {
            API_HOST = host;
        }
        // else use default host
    } catch (e) {
        // do something if fetching from localstorage fails
        API_HOST = 'https://link.sun-asterisk.vn';
    }

    // shorten function
    try {
        const {
            data: { shortUrl },
        } = await axios({
            method: 'POST',
            timeout: 20000,
            url: `${API_HOST}/api/url/submit`,
            headers: {
                'X-API-Key': API_KEY,
            },
            data: {
                target: urlToShorten,
                password,
            },
        });
        return shortUrl;
    } catch (e) {
        // time out
        if (e.code === 'ECONNABORTED') {
            return 504;
        }
        // return status code
        if (e.response) {
            return e.response.status;
        }
    }
};

// Calling function
browser.runtime.onMessage.addListener(async (request, sender, response) => {
    // shorten request
    if (request.msg === 'start') {
        return shortenUrl(request.API_key, request.pageUrl, request.password);
    }
    // store urls to history
    if (request.msg === 'store') {
        const { curURLCollection } = request;
        const { curURLPair } = request;
        // find & remove duplicates
        const noDuplicateArray = curURLCollection.filter(el => {
            return el.longUrl !== curURLPair.longUrl;
        });
        const count = noDuplicateArray.length;
        // delete first pair if size exceeds 15
        if (count >= 15) {
            noDuplicateArray.shift();
        }
        // push to the array
        noDuplicateArray.push(curURLPair);
        // save to local storage
        await browser.storage.local.set({
            URL_array: noDuplicateArray,
        });
    }
});
