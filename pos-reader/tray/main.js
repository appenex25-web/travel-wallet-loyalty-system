const { app, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const express = require('express');

const PORT = Number(process.env.POS_READER_PORT) || 31337;
const READER_URL = `http://localhost:${PORT}`;
// One link: use this in the browser; allow "Local network access" in Chrome so Scan card works
const APP_URL = process.env.TRAVEL_WALLET_APP_URL || 'https://www.appenex.org';

// --- Reader API (same as pos-reader server.js) ---
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

function createTray() {
  tray = new Tray(getTrayIcon());
  tray.setToolTip('Travel Wallet NFC Reader – use with ' + APP_URL);
  const startAtLogin = app.getLoginItemSettings().openAtLogin;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Travel Wallet NFC Reader', enabled: false },
    { type: 'separator' },
    {
      label: 'Open Travel Wallet',
      click() {
        shell.openExternal(APP_URL);
      },
    },
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
      label: 'Test reader (localhost)',
      click() {
        shell.openExternal(READER_URL);
      },
    },
    {
      label: 'Exit',
      click() {
        app.quit();
      },
    },
  ]));
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
  app.setLoginItemSettings({ openAtLogin: false });
});

app.on('window-all-closed', () => {});
app.on('before-quit', () => {
  if (server) server.close();
});
