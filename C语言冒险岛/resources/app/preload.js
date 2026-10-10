'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cppNative', {
  run: (payload) => ipcRenderer.invoke('cpp:run', payload),
  check: (payload) => ipcRenderer.invoke('cpp:check', payload),
  health: () => ipcRenderer.invoke('cpp:health'),
  quit: () => ipcRenderer.invoke('cpp:quit'),
  ai: (action) => ipcRenderer.invoke('cpp:ai', action)
});