const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 版本管理
  getVersions: () => ipcRenderer.invoke('get-versions'),
  getInstalledVersions: () => ipcRenderer.invoke('get-installed-versions'),
  installVersion: (versionId) => ipcRenderer.invoke('install-version', versionId),

  // 游戏启动
  launchGame: (options) => ipcRenderer.invoke('launch-game', options),

  // 设置
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // 系统
  openExternal: (url) => ipcRenderer.send('open-external', url),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getJavaVersion: () => ipcRenderer.invoke('get-java-version'),

  // 游戏输出监听
  onGameOutput: (callback) => {
    ipcRenderer.on('game-output', (event, data) => callback(data));
  },
  onGameExit: (callback) => {
    ipcRenderer.on('game-exit', (event, code) => callback(code));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
