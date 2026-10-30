// Starts the local-only Electron desktop window and service.
const { app, BrowserWindow, dialog, session } = require('electron');
const path = require('node:path');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setName('MarsMedic AI');

  let localServer;
  let database;

  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.on('before-quit', () => {
    if (localServer?.listening) localServer.close(() => database?.close());
    else database?.close();
  });

  app.whenReady().then(async () => {
    try {
      const userData = path.join(app.getPath('appData'), 'MarsMedic AI');
      app.setPath('userData', userData);
      process.env.MARSMEDIC_DATA_DIR = path.join(userData, 'data');
      process.env.MARSMEDIC_KEY_PATH = path.join(userData, 'health-data.key');
      process.env.API_HOST = 'localhost';
      process.env.API_PORT = '0';
      process.env.NODE_ENV = 'production';

      const serverModule = await import(pathToFileURL(path.join(app.getAppPath(), 'server/index.js')).href);
      localServer = serverModule.server;
      database = serverModule.database;
      if (!localServer.listening) await once(localServer, 'listening');

      const address = localServer.address();
      const appUrl = `http://localhost:${address.port}`;

      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        let allowed = false;
        try {
          const requestedUrl = new URL(details.url);
          allowed = requestedUrl.origin === appUrl;
        } catch {
          allowed = false;
        }
        callback({ cancel: !allowed });
      });

      const window = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 960,
        minHeight: 700,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });

      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event, url) => {
        if (new URL(url).origin !== appUrl) event.preventDefault();
      });
      await window.loadURL(appUrl);
    } catch (error) {
      console.error('Unable to start MarsMedic AI:', error);
      dialog.showErrorBox(
        'MarsMedic AI could not start',
        `The local app service failed to start.\n\n${error.message}`,
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => app.quit());
}
