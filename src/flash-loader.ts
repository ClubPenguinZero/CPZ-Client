import { App } from "electron";
import path = require("path");

const getPluginName = () => {
    let pluginName: string;
    let pluginVer: string;

    switch (process.platform) {
        case 'win32':
            pluginVer = '32.0.0.303';
            switch (process.arch) {
                case 'ia32':
                    pluginName = 'assets/flash/pepflashplayer32_32_0_0_303.dll';
                    break;

                default:
                case 'x64':
                    pluginName = 'assets/flash/pepflashplayer64_32_0_0_303.dll';
                    break;
            }
            break;
        case 'darwin':
            pluginName = 'assets/flash/PepperFlashPlayer.plugin';
            pluginVer = '34.0.0.231'; // not sure what version this is either but this will satisfy the web check
            break;
        case 'linux':
            pluginName = 'assets/flash/libpepflashplayer.so';
            pluginVer = '32.0.0.303';  // I'm not 100% sure what the version of this is so I'm just guessing.
            break;
    }

    return [pluginName, pluginVer];
};

const loadFlashPlugin = (app: App) => {
    const pluginInfo = getPluginName();

    app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginInfo[0]));
    // We actually need to specify the version or else it will show the Flash upgrade error page when refreshing.
    app.commandLine.appendSwitch('ppapi-flash-version', pluginInfo[1]);
};

export default loadFlashPlugin;