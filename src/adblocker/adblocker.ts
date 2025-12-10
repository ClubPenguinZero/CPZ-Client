import { BrowserWindow, dialog } from 'electron';
import { Store } from '../store';
import { showReloadDialog } from '../reload';
import { adblocker, fetch } from './adblocker_imports';

export let createAdblocker: Function;
export let enableOrDisableAdblocker: Function;

if (adblocker != null) {
    const setBlockerInStore = (store: Store, blocker: typeof adblocker.ElectronBlocker) => {
        store.private.set('blocker', blocker);
    };
    
    const getBlockerFromStore = (store: Store) => {
        return store.private.get('blocker');
    };
    
    const checkIfAdblockerIsEnabled = (store: Store) => {
        return store.public.get('disableAds');
    };
    
    const updateAdblockerIsEnabled = (store: Store) => {
        store.public.set('disableAds', !checkIfAdblockerIsEnabled(store));
    };
    
    const startAdblocker = (mainWindow: BrowserWindow, blocker: typeof adblocker.ElectronBlocker) => {
        blocker.enableBlockingInSession(mainWindow.webContents.session);
    };
    
    const stopAdblocker = (mainWindow: BrowserWindow, blocker: typeof adblocker.ElectronBlocker) => {
        blocker.disableBlockingInSession(mainWindow.webContents.session);
    };

    createAdblocker = async (store: Store, mainWindow: BrowserWindow) => {
        const blocker = await adblocker.ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    
        setBlockerInStore(store, blocker);
    
        // Start adblocker if is enabled.
        if (checkIfAdblockerIsEnabled(store)) {
            startAdblocker(mainWindow, blocker);
        }
    };
    
    enableOrDisableAdblocker = async (store: Store, mainWindow: BrowserWindow) => {
        const blocker = getBlockerFromStore(store);
        const localizer = store.private.get('localizer');
    
        if (!checkIfAdblockerIsEnabled(store)) {
            const confirmationResult = await dialog.showMessageBox(mainWindow, {
                buttons: localizer.__buttons(),
                title: localizer.__('PROMPT_ADBLOCK_TITLE'),
                message: localizer.__('PROMPT_ADBLOCK_MSG'),
            });
    
            if (confirmationResult.response !== 0) {
                return;
            }
    
            startAdblocker(mainWindow, blocker);
        } else {
            stopAdblocker(mainWindow, blocker);
        }
    
        updateAdblockerIsEnabled(store);

        showReloadDialog(store, mainWindow);
    };
}