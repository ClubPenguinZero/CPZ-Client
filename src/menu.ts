import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, dialog, app } from "electron";
import { adblocker } from "./adblocker/adblocker_imports";
import clearCache from "./cache";
import toggleDevTools from "./dev-tools";
import { enableOrDisableDiscordRPC, enableOrDisableDiscordRPCLocationTracking } from "./discord";
import { Store } from "./store";
import changeClubPenguinUrl, { ALLOW_URL_CHANGE } from "./urlchanger";
import { toggleFullScreen } from "./window";
import { stringInject } from "./stringinject";
import { GAME_NAME } from "./discord/constants";
import { autoSelectLanguages, supportedLanguages } from "./localization/i18n";
import { showRestartDialog } from "./reload";

const createMenuTemplate = (store: Store, mainWindow: BrowserWindow): MenuItemConstructorOptions[] => {
    const localizer = store.private.get('localizer');

    const template = [];

    const isMac = process.platform === 'darwin';

    const options: MenuItemConstructorOptions = {
        id: '1',
        label: localizer.__('MENU_OPTIONS'),
        submenu: [
            {
                label: localizer.__('MENU_CACHE'),
                click: () => { clearCache(mainWindow); }
            },
            { type: 'separator' },
            {
                label: localizer.__('MENU_DEV_TOOLS'),
                accelerator: 'CommandOrControl+Shift+I',
                click: () => { toggleDevTools(store, mainWindow); }
            },
            { type: 'separator' },

            // This is a lil ugly but I don't think it'll cause any weirdness
            ALLOW_URL_CHANGE ? { label: stringInject(localizer.__('MENU_URL_CHANGE'), [GAME_NAME]), click: () => { changeClubPenguinUrl(store, mainWindow); }} : { type: 'separator' },

            { type: 'separator' },
            {
                label: localizer.__('MENU_REFRESH'),
                accelerator: 'F5',
                role: 'reload',
            },
            {
                label: localizer.__('MENU_REFRESH_NOCACHE'),
                accelerator: 'CommandOrControl+R',
                click: () => { mainWindow.webContents.reloadIgnoringCache(); }
            },
            { type: 'separator' },
            {
                label: localizer.__('MENU_FULLSCREEN'),
                accelerator: 'F11',
                click: () => { toggleFullScreen(store, mainWindow); }
            },
            {
                label: localizer.__('MENU_ZOOM_IN'),
                role: 'zoomIn',
                accelerator: 'CommandOrControl+=',
            },
            {
                label: localizer.__('MENU_ZOOM_OUT'),
                role: 'zoomOut',
                accelerator: 'CommandOrControl+-',
            },
            {
                label: localizer.__('MENU_ZOOM_RESET'),
                role: 'resetZoom',
                accelerator: 'CommandOrControl+0',
            },
            { type: 'separator' },
            {
                label: localizer.__('MENU_QUIT'),
                role: isMac ? 'close' : 'quit'
            }
        ]
    };
    template.push(options);
    
    if (adblocker != null) {
		const enableOrDisableAdblocker = require("./adblocker/adblocker").enableOrDisableAdblocker;
        const adblock: MenuItemConstructorOptions = {
            id: '2',
            label: localizer.__('MENU_ADBLOCK'),
            submenu: [
                {
                    label: localizer.__('MENU_ADBLOCK_TOGGLE'),
                    click: () => { enableOrDisableAdblocker(store, mainWindow); }
                }
            ]
        };
        template.push(adblock);
    }

    const discord: MenuItemConstructorOptions = {
        id: (template.length + 1).toString(), // Makes sure this menu's id is either '2' or '3'
        label: localizer.__('MENU_RICH_PRESENCE'),
        submenu: [
            {
                label: localizer.__('MENU_RICH_PRESENCE_TOGGLE'),
                click: () => { enableOrDisableDiscordRPC(store, mainWindow); }
            },
            {
                label: localizer.__('MENU_RICH_PRESENCE_ROOM_TOGGLE'),
                click: () => { enableOrDisableDiscordRPCLocationTracking(store, mainWindow); }
            }
        ]
    };
    template.push(discord);

    if (!autoSelectLanguages) {
        // Build up the list of available languages.
        const langList: MenuItemConstructorOptions[] = [];

        supportedLanguages.forEach(language => {
            langList.push(
                {
                    label: language,
                    click: async () => {
                        if (store.public.get('language') == language) {
                            await dialog.showMessageBox(mainWindow, {
                                buttons: localizer.__buttons(true),
                                title: localizer.__('PROMPT_SAME_LANGUAGE_TITLE'),
                                message: localizer.__('PROMPT_SAME_LANGUAGE_MSG'),
                            });
                        } else {
                            const shouldReload = await showRestartDialog(store, app, mainWindow, false);
                            if (shouldReload) {
                                await localizer.chooseLanguage(store, language);
                                app.quit();
                            }
                        }
                    }
                }
            );
        });
        
        // Put em in the menu
        const language: MenuItemConstructorOptions = {
            id: (template.length + 1).toString(), // Makes sure this menu's id is either '3' or '4'
            label: localizer.__('MENU_LANGUAGE'),
            submenu: langList
        };
        template.push(language);
    }

    return template;
};

const startMenu = (store: Store, mainWindow: BrowserWindow) => {
    buildMenu(createMenuTemplate(store, mainWindow));
};

const buildMenu = (menuTemplate: MenuItemConstructorOptions[] | MenuItem[]) => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
};

export default startMenu;