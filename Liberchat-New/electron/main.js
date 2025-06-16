const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        titleBarStyle: 'default', // Use default title bar style
    });

    // Load the app URL or local HTML
    mainWindow.loadURL('https://liberchat-3-0-1.onrender.com/');

    // Remove default menu (this step disables the "Help", "Edit", and other default menus)
    const template = [];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu); // This removes the default menu
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on('close-app', () => {
        mainWindow.close(); // Close the window
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit(); // Quit the application when all windows are closed
    }
});
