const { app, Tray, Menu, nativeImage, shell, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');

const PORT = Number(process.env.POS_READER_PORT) || 31337;
const READER_URL = `http://localhost:${PORT}`;
const LOCAL_ADMIN_PORT = 4780;
const LOCAL_ADMIN_URL = `http://localhost:${LOCAL_ADMIN_PORT}`;

function getServerUrlPath() {
  return path.join(app.getPath('userData'), 'server-url.txt');
}
function getServerUrl() {
  try {
    const p = getServerUrlPath();
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim() || null;
  } catch (e) {}
  return null;
}
function setServerUrl(url) {
  const p = getServerUrlPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, url.trim(), 'utf8');
}

function getWebDistPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web-dist');
  }
  return path.join(__dirname, '..', '..', 'web', 'dist');
}

// --- Express server (same API as pos-reader server.js) ---
let lastUid = null;
const serverApp = express();
serverApp.use(express.json());
function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}
serverApp.use((req, res, next) => {
  corsHeaders(res);
  next();
});
serverApp.options('*', (req, res) => {
  corsHeaders(res);
  res.sendStatus(204);
});
serverApp.post('/uid/clear', (req, res) => {
  lastUid = null;
  res.json({ ok: true });
});
serverApp.get('/uid', (req, res) => {
  res.json({ uid: lastUid });
});
serverApp.post('/uid', (req, res) => {
  const uid = req.body && req.body.uid;
  lastUid = typeof uid === 'string' ? uid : null;
  res.json({ uid: lastUid });
});

// Optional: try to use nfc-pcsc if available (e.g. when running from source with npm)
function tryStartNfcReader() {
  try {
    const nfcPcsc = require('nfc-pcsc');
    const NFC = nfcPcsc.default || nfcPcsc;
    if (!NFC) return false;
    const nfc = new NFC();
    nfc.on('reader', (reader) => {
      reader.on('card', (card) => { lastUid = card.uid; });
      reader.on('error', () => {});
    });
    nfc.on('error', () => {});
    return true;
  } catch (e) {
    return false;
  }
}

let tray = null;
let server = null;
let localAdminServer = null;

// Minimal 16x16 PNG (single dark teal pixel) for tray when no icon file present
const FALLBACK_ICON = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGE0DBgZGBj+Ux' +
  'QDANl0EBEAAAAASUVORK5CYII=',
  'base64'
);

function getTrayIcon() {
  const iconPath = path.join(__dirname, 'icon.png');
  const fs = require('fs');
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img.resize({ width: 16, height: 16 });
  }
  return nativeImage.createFromBuffer(FALLBACK_ICON).resize({ width: 16, height: 16 });
}

function startLocalAdminServer() {
  if (localAdminServer) return true;
  const webDist = getWebDistPath();
  if (!fs.existsSync(webDist) || !fs.existsSync(path.join(webDist, 'index.html'))) {
    return false;
  }
  const adminApp = express();
  adminApp.get('/config.json', (req, res) => {
    const url = getServerUrl();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ apiUrl: url || 'http://localhost:3000' });
  });
  adminApp.use(express.static(webDist, { index: 'index.html' }));
  adminApp.get('*', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
  try {
    localAdminServer = adminApp.listen(LOCAL_ADMIN_PORT, '127.0.0.1');
    return true;
  } catch (e) {
    return false;
  }
}

function showServerUrlDialog(onSaved) {
  const configWin = new BrowserWindow({
    width: 420,
    height: 240,
    title: 'Travel Wallet — Server URL',
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  configWin.setMenu(null);
  configWin.loadFile(path.join(__dirname, 'config-window.html'), {
    query: { current: getServerUrl() || '' },
  });
  ipcMain.once('server-url', (_, savedUrl) => {
    setServerUrl(savedUrl);
    configWin.close();
    if (onSaved) onSaved();
  });
}

function openAdminForNfcLinking() {
  const url = getServerUrl();
  if (!url) {
    showServerUrlDialog(startLocalAdminAndOpen);
    return;
  }
  startLocalAdminAndOpen();
}

function startLocalAdminAndOpen() {
  if (!startLocalAdminServer()) {
    const url = getServerUrl();
    if (url) shell.openExternal(url.replace(/\/$/, '').replace(/:3000$/, ''));
    return;
  }
  shell.openExternal(LOCAL_ADMIN_URL);
}

function createTray() {
  const trayIcon = getTrayIcon();
  tray = new Tray(trayIcon);
  tray.setToolTip('Travel Wallet NFC Reader – ' + READER_URL);
  updateMenu();
}

function updateMenu() {
  const startAtLogin = app.getLoginItemSettings().openAtLogin;
  const menu = Menu.buildFromTemplate([
    { label: 'Travel Wallet NFC Reader', enabled: false },
    { type: 'separator' },
    {
      label: 'Start when Windows starts',
      type: 'checkbox',
      checked: startAtLogin,
      click(menuItem) {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      },
    },
    { type: 'separator' },
    {
      label: 'Open reader URL',
      click() {
        shell.openExternal(READER_URL);
      },
    },
    {
      label: 'Open admin for NFC linking',
      click() {
        openAdminForNfcLinking();
      },
    },
    {
      label: 'Set server URL…',
      click() {
        showServerUrlDialog(null);
      },
    },
    {
      label: 'Exit',
      click() {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = serverApp.listen(PORT, '127.0.0.1', () => {
      tryStartNfcReader();
      resolve();
    });
    server.on('error', reject);
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (err) {
    console.error('Could not start server:', err);
    app.quit();
    return;
  }
  createTray();
  app.setLoginItemSettings({ openAtLogin: false }); // default off; user can enable in tray
});

app.on('window-all-closed', () => {});
app.on('before-quit', () => {
  if (server) server.close();
  if (localAdminServer) localAdminServer.close();
});
