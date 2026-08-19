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

  // 启动画面进度监听
  onSplashProgress: (callback) => {
    ipcRenderer.on('splash-progress', (event, data) => callback(data));
  },

  // 移除启动画面监听
  removeSplashListener: () => {
    ipcRenderer.removeAllListeners('splash-progress');
  },

  // ============ API 接口 ============
  
  // 搜索项目
  searchProjects: (query, options) => ipcRenderer.invoke('search-projects', query, options),
  
  // 获取项目详情
  getProject: (projectId) => ipcRenderer.invoke('get-project', projectId),
  
  // 获取项目版本
  getProjectVersions: (projectId, options) => ipcRenderer.invoke('get-project-versions', projectId, options),
  
  // 下载模组/资源包
  downloadMod: (url, fileName, type) => ipcRenderer.invoke('download-mod', url, fileName, type),
  
  // 获取游戏版本列表
  getGameVersions: () => ipcRenderer.invoke('get-game-versions'),
  
  // 下载游戏
  downloadGame: (versionId) => ipcRenderer.invoke('download-game', versionId),
  
  // 下载进度监听
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  
  // 获取 Forge 版本
  getForgeVersions: () => ipcRenderer.invoke('get-forge-versions'),
  
  // 获取 Fabric 版本
  getFabricVersions: () => ipcRenderer.invoke('get-fabric-versions'),
  
  // 获取 Modrinth 游戏版本
  getModrinthGameVersions: () => ipcRenderer.invoke('get-modrinth-game-versions'),
  
  // 扫描已安装模组
  scanInstalledMods: (versionId) => ipcRenderer.invoke('scan-installed-mods', versionId),
  
  // 扫描资源包
  scanResourcepacks: () => ipcRenderer.invoke('scan-resourcepacks'),
  
  // 扫描光影包
  scanShaderpacks: () => ipcRenderer.invoke('scan-shaderpacks'),
  
  // ============ 局域网联机 ============
  
  // 获取网络接口
  getNetworkInterfaces: () => ipcRenderer.invoke('get-network-interfaces'),
  
  // 扫描局域网
  scanLAN: (data) => ipcRenderer.invoke('scan-lan', data),
  
  // 广播局域网消息
  broadcastLAN: (data) => ipcRenderer.invoke('broadcast-lan', data),
  
  // 监听局域网广播
  onLANBroadcast: (callback) => {
    ipcRenderer.on('lan-broadcast', (event, data) => callback(data));
  },
  
  // ============ 原生通知 ============
  // 显示 Windows 原生 Toast 通知
  notify: (options) => ipcRenderer.invoke('notify', options),

  // ============ 正版账号 (Microsoft) ============
  startMicrosoftAuth: (clientId) => ipcRenderer.invoke('start-ms-auth', clientId),
  pollMicrosoftAuth: (data) => ipcRenderer.invoke('poll-ms-auth', data),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccount: (account) => ipcRenderer.invoke('save-account', account),
  removeAccount: (id) => ipcRenderer.invoke('remove-account', id),
  setActiveAccount: (id) => ipcRenderer.invoke('set-active-account', id),

  // ============ Magician 助手 ============

  // Wiki 查询
  queryWiki: (query) => ipcRenderer.invoke('query-wiki', query),


    // ===== 自动更新 API =====
    getUpdaterConfig: () => ipcRenderer.invoke('get-updater-config'),
    setUpdateSource: (source) => ipcRenderer.invoke('set-update-source', source),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (event, data) => callback(data)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', () => callback()),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
});
