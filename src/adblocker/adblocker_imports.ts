export let adblocker: any;
export let fetch: Function;

try {
    adblocker = require('@ghostery/adblocker-electron');
    fetch = require('cross-fetch');
} catch (err) {
    adblocker = null;
    fetch = null;
}