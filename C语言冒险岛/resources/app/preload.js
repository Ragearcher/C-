'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cppNative', {
  run: (payload) => ipcRenderer.invoke('cpp:run', payload),
  check: (payload) => ipcRenderer.invoke('cpp:check', payload),
  health: () => ipcRenderer.invoke('cpp:health'),
  updateCheck: (force) => ipcRenderer.invoke('cpp:update-check', { force: !!force }),
  onUpdateProgress: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on('cpp:update-progress', h); return () => ipcRenderer.removeListener('cpp:update-progress', h); },
  // tag 必须传远端目标版本，用于 update.bat 的版本校验；size 用于校验下载完整性
  updateApply: (url, tag, size) => ipcRenderer.invoke('cpp:update-apply', { url, tag, size }),
  updateLastResult: () => ipcRenderer.invoke('cpp:update-last-result'),
  quit: () => ipcRenderer.invoke('cpp:quit'),
  ai: (action) => ipcRenderer.invoke('cpp:ai', action)
});
