'use strict';

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, BrowserView, protocol, ipcMain, Menu, shell } = require('electron');
const { CPP_COMPILER, executeCpp, checkCode } = require('./cpp-engine');
const { checkUpdate, downloadAndApply, cleanupStaleUpdate, readLastUpdateResult } = require('./engine/update-check');
const log = require('./engine/log');

app.setPath('userData', path.join(app.getPath('appData'), 'C++ 冒险岛'));
const APP_DIR = path.join(__dirname, 'app');
let win = null;
let aiView = null;
let aiVisible = false;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
}]);

function serveApp(request) {
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return new Response('bad url', { status: 400 });
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel === '' || rel === '/') rel = '/index.html';
  const target = path.resolve(APP_DIR, '.' + rel);
  if (target !== APP_DIR && !target.startsWith(APP_DIR + path.sep)) {
    return new Response('forbidden', { status: 403 });
  }
  return fs.promises.readFile(target).then((buf) => {
    const type = MIME[path.extname(target).toLowerCase()] || 'application/octet-stream';
    return new Response(buf, { status: 200, headers: { 'content-type': type, 'cache-control': 'no-store' } });
  }).catch(() => new Response('not found: ' + rel, { status: 404 }));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#f4f6fb',
    icon: path.join(__dirname, 'icon.ico'),
    title: 'C 语言冒险岛',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; if (aiView) { aiView.webContents.destroy(); aiView = null; } });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL('app://bundle/index.html');
  return win;
}

function wireIpc() {
  ipcMain.handle('cpp:health', () => ({ ok: true, compiler: CPP_COMPILER }));
  ipcMain.handle('cpp:quit', () => { app.quit(); return { ok: true }; });
  ipcMain.handle('cpp:ai', (_event, action) => {
    if (!win || win.isDestroyed()) return { ok: false };
    if (action === 'show') {
      if (!aiView) {
        aiView = new BrowserView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
        win.setBrowserView(aiView);
        aiView.webContents.loadURL('https://chat.deepseek.com/');
      }
      const [w, h] = win.getContentSize();
      aiView.setBounds({ x: 0, y: 64, width: w, height: Math.max(0, h - 64) });
      aiVisible = true;
      return { ok: true };
    }
    if (aiView) {
      aiView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      aiVisible = false;
    }
    return { ok: true };
  });
  ipcMain.handle('cpp:run', async (_event, payload) => {
    try {
      return await executeCpp((payload && payload.code) || '', (payload && payload.stdin) || '');
    } catch (e) {
      return { ok: false, compileError: false, stage: 'run', stdout: '', stderr: e && e.message ? e.message : String(e) };
    }
  });
  ipcMain.handle('cpp:update-check', async (_event, payload) => {
    try { return await checkUpdate(!!(payload && payload.force)); }
    catch (e) { return { needsUpdate: false, error: e && e.message ? e.message : String(e) }; }
  });
  ipcMain.handle('cpp:update-apply', async (_event, payload) => {
    try {
      const url = payload && payload.url;
      const tag = payload && payload.tag;
      const size = Number((payload && payload.size) || 0) || 0;
      log.info('开始下载更新包：' + url + '（目标版本 ' + tag + '）');
      // 注意：这里必须传「远端目标版本」，而不是本地版本。
      // 旧实现传的是本地 tag，导致 update.bat 的版本校验逻辑完全反向。
      return await downloadAndApply(url, tag, (got, total, bps) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('cpp:update-progress', { got, total, bps });
        }
      }, size);
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  });
  ipcMain.handle('cpp:update-last-result', () => {
    try { return readLastUpdateResult(); }
    catch (e) { return null; }
  });
  ipcMain.handle('cpp:check', async (_event, payload) => {
    try {
      return await checkCode((payload && payload.code) || '', (payload && payload.stdin) || '', (payload && payload.check) || {});
    } catch (e) {
      return { ok: false, compileError: false, stage: 'run', stdout: '', stderr: e && e.message ? e.message : String(e), pass: false };
    }
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    protocol.handle('app', serveApp);
    wireIpc();
    Menu.setApplicationMenu(null);
    createWindow();
    // 延迟清理上一次更新残留的 update.zip / extracted。
    // 延后 8 秒是为了避开 update.bat 收尾阶段的竞态。
    setTimeout(() => { try { cleanupStaleUpdate(); } catch (e) {} }, 8000);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}