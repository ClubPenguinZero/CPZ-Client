import { BrowserWindow, dialog } from "electron";
import { Store, DEFAULT_URL } from "./store";
import prompt from "electron-prompt";
import { stringInject } from './stringinject';
import { GAME_NAME } from "./discord/constants";

// Change this to false if you want to disable the ability to change URLs
export const ALLOW_URL_CHANGE = true;

export const getUrlFromStore = (store: Store) => {
    return store.public.get('url');
};

const setUrlFromStore = (store: Store, url: string) => {
    store.public.set('url', url);
};

const changeClubPenguinUrl = async (store: Store, mainWindow: BrowserWindow) => {
    if (!ALLOW_URL_CHANGE) {
        return;
    }

    const url = getUrlFromStore(store);
    const localizer = store.private.get('localizer');

    const confirmationResult = await dialog.showMessageBox(mainWindow, {
        buttons: localizer.__buttons(),
        title: localizer.__('PROMPT_URL_CHANGE_TITLE'),
        message: stringInject(localizer.__('PROMPT_URL_CHANGE_MSG'), [url]),
    });

    if (confirmationResult.response !== 0) {
        return;
    }

    const result = await prompt({
        title: stringInject(localizer.__('INPUT_URL_CHANGE_TITLE'), [GAME_NAME]),
        label: localizer.__('INPUT_URL_CHANGE_MSG'),
        value: url,
        inputAttrs: {
            type: 'url'
        },
        type: 'input',

    }, mainWindow);

    if (result === null) {
        return;
    }

    setUrlFromStore(store, result);

    mainWindow.loadURL(result);
};

export const gotoDefaultUrl = async (store: Store, mainWindow: BrowserWindow) => {
    if (!ALLOW_URL_CHANGE) {
        return;
    }

    setUrlFromStore(store, DEFAULT_URL);

    mainWindow.loadURL(DEFAULT_URL);
};

export default changeClubPenguinUrl;