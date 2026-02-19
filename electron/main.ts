import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'path';
import { OsuDbService } from './services/OsuDbService';


let mainWindow: BrowserWindow | null = null;
const dbService = new OsuDbService();

// Register custom protocol for reading files
protocol.registerSchemesAsPrivileged([
    { scheme: 'osumusic', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
]);

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 480,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        title: "osu!music",
        backgroundColor: '#111',
        titleBarStyle: 'hiddenInset', // Allows drag region at top while keeping controls
    });

    // Load the index.html of the app.
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
};

app.on('ready', async () => {
    // Handle file protocol
    protocol.handle('osumusic', (request) => {
        const url = request.url.replace('osumusic://', '');
        // decodeURI is important because file paths might have spaces or special chars
        const filePath = decodeURI(url);
        // Security check: ensure it's within allowed paths? 
        // For now, we trust the app logic to only request valid files.
        return net.fetch('file://' + filePath);
    });

    try {
        await dbService.openRealm();
        console.log("Database ready");
    } catch (err) {
        console.error("Failed to open database", err);
        // We still open the window, but the app might show an error state
    }

    createWindow();
});

// IPC Handlers
ipcMain.handle('get-beatmaps', async () => {
    try {
        return dbService.getBeatmaps();
    } catch (e) {
        console.error(e);
        return [];
    }
});

ipcMain.handle('open-external', async (_, url) => {
    return require('electron').shell.openExternal(url);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    dbService.close();
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
