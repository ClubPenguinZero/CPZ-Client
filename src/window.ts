import { BrowserWindow } from 'electron';
import path = require('path');
import { adblocker } from "./adblocker/adblocker_imports";
import { Store } from "./store";
import { getUrlFromStore } from './urlchanger';

export const toggleFullScreen = (store: Store, mainWindow: BrowserWindow) => {
	// !null or !undefined returns true so we have to do this.
    let fullScreen = store.private.get("fullScreen") ?? false;
	fullScreen = !fullScreen;

    store.private.set("fullScreen", fullScreen);

    mainWindow.setFullScreen(fullScreen);
};

interface FavIconByPlatforms {
    [key: string]: () => void;
}

const createWindow = async (store: Store) => {
    const setFaviconByPlatform: FavIconByPlatforms = {
        win32: () => {
            mainWindow.setIcon(path.join(__dirname, "assets/favicon.ico"));
        },
        darwin: () => {
            mainWindow.setIcon(path.join(__dirname, "assets/icon.png"));
        },
        linux: () => {
            mainWindow.setIcon(path.join(__dirname, "assets/icon.png"));
        },
    };

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: store.private.get('localizer').__('STARTING'),
        webPreferences: {
            plugins: true,
        },
    });

    setFaviconByPlatform[process.platform]();

    mainWindow.setMenu(null);
    mainWindow.maximize();
	
	if (adblocker != null) {
		const createAdblocker = require("./adblocker/adblocker").createAdblocker;
		await createAdblocker(store, mainWindow);
	}

    const url = getUrlFromStore(store);
    mainWindow.loadURL(url);

    return mainWindow;
};

export default createWindow;
