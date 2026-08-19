const { app, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 更新源配置
const UPDATE_SOURCES = {
  github: {
    name: 'GitHub',
    provider: 'github',
    owner: 'MagiciansWand',
    repo: 'MagicianPCL',
  },
  gitee: {
    name: 'Gitee',
    provider: 'generic',
    url: 'https://gitee.com/magicianswand/MagicianPCL/releases/download/',
  }
};

// 用户配置存储路径
const configPath = path.join(app.getPath('documents'), 'MagicianPCL', 'updater.json');

// 加载用户配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('加载更新配置失败:', e.message);
  }
  return { source: 'github', autoCheck: true };
}

// 保存用户配置
function saveConfig(config) {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.warn('保存更新配置失败:', e.message);
  }
}

// 配置 autoUpdater 的更新源
function configureUpdateSource(sourceKey) {
  const source = UPDATE_SOURCES[sourceKey];
  if (!source) {
    console.warn('未知的更新源:', sourceKey);
    return false;
  }

  if (source.provider === 'github') {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: source.owner,
      repo: source.repo,
    });
  } else if (source.provider === 'generic') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: source.url,
    });
  }

  console.log('更新源已切换为:', source.name);
  return true;
}

// 检查更新（不自动下载）
async function checkForUpdates() {
  const config = loadConfig();
  configureUpdateSource(config.source);

  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      available: result.updateInfo.version !== app.getVersion(),
      version: result.updateInfo.version,
      releaseDate: result.updateInfo.releaseDate,
      releaseNotes: result.updateInfo.releaseNotes || '',
    };
  } catch (e) {
    console.error('检查更新失败:', e.message);
    return { error: e.message };
  }
}

// 下载更新
function downloadUpdate() {
  return new Promise((resolve, reject) => {
    autoUpdater.downloadUpdate()
      .then(() => resolve({ success: true }))
      .catch(e => reject(e));
  });
}

// 安装更新（退出并安装）
function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

// 注册 IPC handlers
function registerUpdaterHandlers() {
  const { ipcMain } = require('electron');

  // 获取当前配置
  ipcMain.handle('get-updater-config', () => {
    return loadConfig();
  });

  // 设置更新源
  ipcMain.handle('set-update-source', (event, sourceKey) => {
    const config = loadConfig();
    config.source = sourceKey;
    saveConfig(config);
    return configureUpdateSource(sourceKey);
  });

  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    return await checkForUpdates();
  });

  // 下载更新
  ipcMain.handle('download-update', async () => {
    try {
      await downloadUpdate();
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  // 安装更新
  ipcMain.handle('install-update', () => {
    quitAndInstall();
  });

  // 进度通知
  autoUpdater.on('download-progress', (progressObj) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('update-download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    });
  });

  autoUpdater.on('update-downloaded', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('update-downloaded');
    });
  });
}

// 启动时自动检查（可配置）
function initAutoCheck() {
  const config = loadConfig();
  if (config.autoCheck) {
    // 延迟 10 秒，避免影响启动速度
    setTimeout(() => {
      checkForUpdates().then(result => {
        if (result.available) {
          const windows = BrowserWindow.getAllWindows();
          windows.forEach(win => {
            win.webContents.send('update-available', result);
          });
        }
      });
    }, 10000);
  }
}

module.exports = {
  registerUpdaterHandlers,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  loadConfig,
  saveConfig,
  configureUpdateSource,
  initAutoCheck,
  UPDATE_SOURCES,
};
