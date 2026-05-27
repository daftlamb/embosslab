const { app, BrowserWindow, ipcMain, shell } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LICENSE_APP_ID = 'emboss-lab';

function licenseStorePath() {
  return path.join(app.getPath('userData'), 'license.json');
}

function base64UrlDecode(value) {
  return Buffer.from(String(value).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function readPublicKey() {
  return fs.readFileSync(path.join(__dirname, 'license', 'public-key.pem'), 'utf8');
}

function verifyLicense(email, code) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedCode = String(code || '').trim();
  if (!normalizedEmail || !normalizedCode) return { valid: false, message: 'Email and license code are required.' };

  const parts = normalizedCode.split('.');
  if (parts.length !== 2) return { valid: false, message: 'License code format is invalid.' };

  let payload;
  try {
    const signature = base64UrlDecode(parts[1]);
    const publicKey = readPublicKey();
    const verified = crypto.verify(null, Buffer.from(parts[0]), publicKey, signature);
    if (!verified) return { valid: false, message: 'License signature is invalid.' };
    payload = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
  } catch (error) {
    return { valid: false, message: 'License code could not be read.' };
  }

  if (payload.app !== LICENSE_APP_ID && payload.app !== '*') return { valid: false, message: 'This license is for a different app.' };
  if (String(payload.email || '').trim().toLowerCase() !== normalizedEmail) return { valid: false, message: 'Email does not match this license.' };
  if (payload.expires && Date.now() > Date.parse(payload.expires)) return { valid: false, message: 'This license has expired.' };

  return { valid: true, email: normalizedEmail, edition: payload.edition || 'standard', expires: payload.expires || '' };
}

function readStoredLicense() {
  try {
    const saved = JSON.parse(fs.readFileSync(licenseStorePath(), 'utf8'));
    return verifyLicense(saved.email, saved.code);
  } catch (error) {
    return { valid: false, message: 'No license found.' };
  }
}

function setupLicenseIpc() {
  ipcMain.handle('license:getStatus', () => readStoredLicense());
  ipcMain.handle('license:activate', (event, payload) => {
    const result = verifyLicense(payload && payload.email, payload && payload.code);
    if (result.valid) {
      fs.writeFileSync(licenseStorePath(), JSON.stringify({
        email: result.email,
        code: String(payload.code).trim(),
        activatedAt: new Date().toISOString()
      }, null, 2));
    }
    return result;
  });
  ipcMain.handle('license:clear', () => {
    try { fs.unlinkSync(licenseStorePath()); } catch (error) {}
    return { valid: false };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 980,
    minHeight: 700,
    title: 'Emboss Lab',
    backgroundColor: '#eee8e1',
    icon: path.join(__dirname, 'icon', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  setupLicenseIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
