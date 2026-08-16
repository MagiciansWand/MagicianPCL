const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const axios = require('axios');

// 配置
const CONFIG = {
  minecraftDir: path.join(app.getPath('appData'), '.minecraft'),
  versionsDir: path.join(app.getPath('appData'), '.minecraft', 'versions'),
  librariesDir: path.join(app.getPath('appData'), '.minecraft', 'libraries'),
  assetsDir: path.join(app.getPath('appData'), '.minecraft', 'assets'),
  launcherDir: path.join(app.getPath('documents'), 'MagicianPCL'),
};

// 确保目录存在
function ensureDirectories() {
  Object.values(CONFIG).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../renderer/assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 开发工具（生产环境注释掉）
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 窗口控制
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    mainWindow.close();
  });
}

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============ IPC 处理 ============

// 1. 获取 Minecraft 版本列表
ipcMain.handle('get-versions', async () => {
  try {
    const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    return response.data;
  } catch (error) {
    console.error('获取版本列表失败:', error);
    return { error: '无法获取版本列表，请检查网络连接' };
  }
});

// 2. 获取已安装的版本
ipcMain.handle('get-installed-versions', () => {
  try {
    if (!fs.existsSync(CONFIG.versionsDir)) {
      return [];
    }
    const dirs = fs.readdirSync(CONFIG.versionsDir);
    const versions = [];
    dirs.forEach(dir => {
      const jsonPath = path.join(CONFIG.versionsDir, dir, `${dir}.json`);
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          versions.push({
            id: data.id || dir,
            type: data.type || 'release',
            installed: true,
            path: path.join(CONFIG.versionsDir, dir),
          });
        } catch (e) {
          // 忽略无效版本
        }
      }
    });
    return versions;
  } catch (error) {
    console.error('获取已安装版本失败:', error);
    return [];
  }
});

// 3. 下载并安装版本
ipcMain.handle('install-version', async (event, versionId) => {
  try {
    const manifest = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const version = manifest.data.versions.find(v => v.id === versionId);
    if (!version) {
      return { success: false, error: '未找到该版本' };
    }

    const detailResponse = await axios.get(version.url);
    const detail = detailResponse.data;

    const versionDir = path.join(CONFIG.versionsDir, versionId);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(versionDir, `${versionId}.json`),
      JSON.stringify(detail, null, 2)
    );

    if (detail.downloads && detail.downloads.client) {
      const clientUrl = detail.downloads.client.url;
      const clientPath = path.join(versionDir, `${versionId}.jar`);
      const clientResponse = await axios({
        method: 'GET',
        url: clientUrl,
        responseType: 'stream',
      });
      const writer = fs.createWriteStream(clientPath);
      clientResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    if (detail.libraries) {
      for (const lib of detail.libraries) {
        if (lib.downloads && lib.downloads.artifact) {
          const libUrl = lib.downloads.artifact.url;
          const libPath = path.join(CONFIG.librariesDir, lib.downloads.artifact.path);
          const libDir = path.dirname(libPath);
          if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
          }
          try {
            const libResponse = await axios({
              method: 'GET',
              url: libUrl,
              responseType: 'stream',
            });
            const writer = fs.createWriteStream(libPath);
            libResponse.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
          } catch (e) {
            console.warn(`下载库失败: ${libUrl}`, e.message);
          }
        }
      }
    }

    return { success: true, versionId };
  } catch (error) {
    console.error('安装版本失败:', error);
    return { success: false, error: error.message };
  }
});

// 4. 启动游戏
ipcMain.handle('launch-game', async (event, launchOptions) => {
  const { versionId, username, uuid, memory, javaPath } = launchOptions;

  try {
    const jsonPath = path.join(CONFIG.versionsDir, versionId, `${versionId}.json`);
    if (!fs.existsSync(jsonPath)) {
      return { success: false, error: '版本文件不存在' };
    }
    const versionData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const classpath = [];
    const clientJar = path.join(CONFIG.versionsDir, versionId, `${versionId}.jar`);
    if (fs.existsSync(clientJar)) {
      classpath.push(clientJar);
    }

    if (versionData.libraries) {
      for (const lib of versionData.libraries) {
        if (lib.downloads && lib.downloads.artifact) {
          const libPath = path.join(CONFIG.librariesDir, lib.downloads.artifact.path);
          if (fs.existsSync(libPath)) {
            classpath.push(libPath);
          }
        }
      }
    }

    const jvmArgs = [
      `-Xmx${memory || 2048}M`,
      `-Djava.library.path=${path.join(CONFIG.minecraftDir, 'versions', versionId, 'natives')}`,
      '-cp',
      classpath.join(';'),
      versionData.mainClass || 'net.minecraft.client.main.Main',
      '--username', username || 'Player',
      '--version', versionId,
      '--gameDir', CONFIG.minecraftDir,
      '--assetsDir', CONFIG.assetsDir,
      '--assetIndex', versionData.assetIndex ? versionData.assetIndex.id : 'legacy',
      '--uuid', uuid || generateUUID(),
      '--accessToken', '0',
      '--userType', 'mojang',
      '--versionType', 'release',
    ];

    const javaExecutable = javaPath || 'java';
    console.log('启动命令:', javaExecutable, jvmArgs.join(' '));

    const gameProcess = spawn(javaExecutable, jvmArgs, {
      cwd: CONFIG.minecraftDir,
      stdio: 'pipe',
      env: process.env,
    });

    gameProcess.stdout.on('data', (data) => {
      console.log(`[游戏] ${data.toString()}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game-output', data.toString());
      }
    });

    gameProcess.stderr.on('data', (data) => {
      console.error(`[游戏错误] ${data.toString()}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game-output', `[错误] ${data.toString()}`);
      }
    });

    gameProcess.on('close', (code) => {
      console.log(`游戏进程退出，代码: ${code}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game-exit', code);
      }
    });

    return { success: true, pid: gameProcess.pid };
  } catch (error) {
    console.error('启动游戏失败:', error);
    return { success: false, error: error.message };
  }
});

// 5. 打开外部链接
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

// 6. 选择目录
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 7. 获取 Java 版本
ipcMain.handle('get-java-version', async () => {
  return new Promise((resolve) => {
    exec('java -version', (error, stdout, stderr) => {
      if (error) {
        resolve({ available: false, error: error.message });
      } else {
        const versionMatch = stderr.match(/version "([^"]+)"/) || stdout.match(/version "([^"]+)"/);
        resolve({
          available: true,
          version: versionMatch ? versionMatch[1] : '未知',
        });
      }
    });
  });
});

// 8. 保存设置
ipcMain.handle('save-settings', (event, settings) => {
  try {
    const settingsPath = path.join(CONFIG.launcherDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 9. 加载设置
ipcMain.handle('load-settings', () => {
  try {
    const settingsPath = path.join(CONFIG.launcherDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return data;
    }
    return {
      theme: 'dark',
      memory: 2048,
      javaPath: '',
      username: 'Player',
      minecraftDir: CONFIG.minecraftDir,
      language: 'zh-CN',
    };
  } catch (error) {
    return {
      theme: 'dark',
      memory: 2048,
      javaPath: '',
      username: 'Player',
      minecraftDir: CONFIG.minecraftDir,
      language: 'zh-CN',
    };
  }
});

// 工具函数：生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
