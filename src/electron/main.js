const tinify = require('tinify');
const argv = require('optimist').argv;
const {app, BrowserWindow, ipcMain, Menu} = require('electron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({width: 1280, height: 800, minWidth: 1280, minHeight: 800});

    if (argv.env === 'development') {
        mainWindow.loadURL('http://localhost:4000/');
    }
    else {
        mainWindow.loadFile('./www/index.html');
    }

    Menu.setApplicationMenu(null);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function quit() {
    app.quit();
}

function buildMenu(data) {
    let template = [];
    
    template.push({
        label: data.strings.MENU_FILE,
        submenu: [
            {label: data.strings.MENU_FILE_EXIT, click: quit}
        ]
    });
    
    let langs = [];
    for(let lang of data.appInfo.localizations) {
        langs.push({label: data.strings["LANGUAGE_" + lang], click: changeLang, custom: lang, checked: data.currentLocale === lang, type: 'checkbox'});
    }

    template.push({
        label: data.strings.MENU_LANGUAGE,
        submenu: langs
    });

    template.push({
        label: data.strings.MENU_HELP,
        submenu: [
            {label: data.strings.MENU_HELP_ABOUT, click: showAbout}
        ]
    });
    
    if(data.env === "development") {
        template.push({label: "Dev", submenu: [
            {label: "Console", click: () => mainWindow.webContents.openDevTools()},
            {label: "Reload", click: () => mainWindow.webContents.reload()}
        ]});
    }
    
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function changeLang(e) {
    mainWindow.send('change-locale', {locale: e.custom});
}

function showAbout() {
    mainWindow.send('show-about');
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('tinify', (e, data) => {
    tinify.key = data.key;
    tinify.fromBuffer(Buffer.from(data.imageData, 'base64')).toBuffer((err, res) => {
        if (err) {
            e.sender.send('tinify-complete', {
                success: false,
                uid: data.uid,
                error: err.message
            });
            return;
        }
        
        e.sender.send('tinify-complete', {
            success: true,
            uid: data.uid,
            data: res.toString('base64')
        });
    });
});

ipcMain.on('update-locale', (e, data) => {
    buildMenu(data);
});