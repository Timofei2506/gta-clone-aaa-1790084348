// Preload - безопасный мост
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('gtaAPI', {
  version: '0.1.0',
  platform: process.platform
})
