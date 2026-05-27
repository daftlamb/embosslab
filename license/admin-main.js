const { app, BrowserWindow, clipboard, ipcMain } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function base64Url(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generateLicense(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const appId = String(input.app || 'emboss-lab').trim();
  const edition = String(input.edition || 'standard').trim();
  const expires = String(input.expires || '').trim();
  if (!email) throw new Error('Email is required.');

  const privatePath = path.join(__dirname, 'private-key.pem');
  if (!fs.existsSync(privatePath)) throw new Error('Missing private-key.pem.');

  const payload = {
    app: appId,
    email,
    edition,
    issued: new Date().toISOString().slice(0, 10),
    expires,
    serial: crypto.randomBytes(8).toString('hex').toUpperCase()
  };
  const payload64 = base64Url(JSON.stringify(payload));
  const signature = crypto.sign(null, Buffer.from(payload64), fs.readFileSync(privatePath));
  return { payload, code: `${payload64}.${base64Url(signature)}` };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 720,
    minWidth: 680,
    minHeight: 620,
    title: 'License Admin',
    backgroundColor: '#f5efe7',
    icon: path.join(__dirname, '..', 'icon', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'admin-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'admin.html'));
}

ipcMain.handle('admin:generate', (event, input) => generateLicense(input || {}));
ipcMain.handle('admin:copy', (event, value) => {
  clipboard.writeText(String(value || ''));
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
