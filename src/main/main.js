const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const path = require('path');

// 设置 App 用户模型 ID，确保 Windows 原生 Toast 通知正常显示（应用名/图标正确）
app.setAppUserModelId('com.magicianpcl.launcher');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const axios = require('axios');
const { ModrinthAPI, MinecraftAPI, ForgeAPI, FabricAPI } = require('./api');

// 配置
const CONFIG = {
  minecraftDir: path.join(app.getPath('appData'), '.minecraft'),
  versionsDir: path.join(app.getPath('appData'), '.minecraft', 'versions'),
  librariesDir: path.join(app.getPath('appData'), '.minecraft', 'libraries'),
  assetsDir: path.join(app.getPath('appData'), '.minecraft', 'assets'),
  launcherDir: path.join(app.getPath('documents'), 'MagicianPCL'),
};

// 全局窗口变量
let mainWindow = null;
let splashWindow = null;


// ============ 启动画面窗口 ============
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0f0f1a',
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));

  // 开发工具
  // splashWindow.webContents.openDevTools();

  return splashWindow;
}

// 更新启动画面进度
function updateSplash(step, message, progress) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash-progress', { step, message, progress, done: false });
  }
}

// 关闭启动画面并显示主窗口
function closeSplashAndShowMain() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash-progress', { 
      step: 'complete', 
      message: '准备就绪！', 
      progress: 100, 
      done: true 
    });
    
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
    }, 500);
  }
  
  if (mainWindow) {
    mainWindow.show();
  }
}


// ============ 主窗口 ============
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../renderer/assets/icon.ico'),
    show: false, // 先隐藏，等启动画面完成
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

// ============ 初始化流程 ============
async function initializeApp() {
  // 创建启动画面
  createSplashWindow();
  
  // 创建主窗口（但不显示）
  createMainWindow();

  // 确保目录存在
  await ensureDirectories();

  // 执行环境检测
  try {
    // 步骤 1: 初始化系统
    updateSplash('init', '正在初始化系统...', 10);
    await sleep(300);
    
    // 步骤 2: 检测 Java 环境
    updateSplash('java', '正在检测 Java 环境...', 25);
    const javaInfo = await detectJava();
    await sleep(200);
    
    // 步骤 3: 检查 Minecraft 目录
    updateSplash('minecraft', '正在检查 Minecraft 目录...', 45);
    await checkMinecraftDirectory();
    await sleep(200);
    
    // 步骤 4: 加载配置文件
    updateSplash('config', '正在加载配置文件...', 65);
    const settings = await loadSettings();
    await sleep(200);
    
    // 步骤 5: 扫描已安装版本
    updateSplash('versions', '正在扫描已安装版本...', 85);
    const installedVersions = await scanInstalledVersions();
    await sleep(300);
    
    // 完成
    updateSplash('complete', '准备就绪！', 100);
    await sleep(500);
    
  } catch (error) {
    console.error('初始化错误:', error);
    updateSplash('error', '初始化失败: ' + error.message, 0);
    await sleep(2000);
  }

  // 关闭启动画面，显示主窗口
  closeSplashAndShowMain();
}

// 确保目录存在
async function ensureDirectories() {
  const dirs = Object.values(CONFIG);
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// 检测 Java 环境
async function detectJava() {
  return new Promise((resolve) => {
    exec('java -version 2>&1', (error, stdout, stderr) => {
      let javaInfo = {
        available: false,
        version: '未检测到',
        path: '未配置',
        bits: '未知',
      };

      if (!error) {
        // 解析 Java 版本
        const versionMatch = (stderr || stdout).match(/version "([^"]+)"/);
        const javaPathMatch = (stderr || stdout).match(/Java(TM) (SE Runtime Environment )?([^ ]+)/i);
        
        javaInfo = {
          available: true,
          version: versionMatch ? versionMatch[1] : '未知版本',
          path: '系统默认',
          bits: process.arch.includes('64') ? '64位' : '32位',
        };
        
        // 尝试获取 Java 路径
        exec('where java', (err, out) => {
          if (!err && out.trim()) {
            javaInfo.path = out.trim().split('\n')[0];
          }
          resolve(javaInfo);
        });
      } else {
        resolve(javaInfo);
      }
    });
  });
}

// 检查 Minecraft 目录
async function checkMinecraftDirectory() {
  const checks = {
    versions: fs.existsSync(CONFIG.versionsDir),
    libraries: fs.existsSync(CONFIG.librariesDir),
    assets: fs.existsSync(CONFIG.assetsDir),
    launcherConfig: fs.existsSync(path.join(CONFIG.launcherDir, 'settings.json')),
  };

  // 如果目录不存在，创建它们
  if (!checks.versions) {
    fs.mkdirSync(CONFIG.versionsDir, { recursive: true });
  }
  if (!checks.libraries) {
    fs.mkdirSync(CONFIG.librariesDir, { recursive: true });
  }
  if (!checks.assets) {
    fs.mkdirSync(CONFIG.assetsDir, { recursive: true });
  }

  return checks;
}

// 加载设置
async function loadSettings() {
  const settingsPath = path.join(CONFIG.launcherDir, 'settings.json');
  
  if (fs.existsSync(settingsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return data;
    } catch (e) {
      console.warn('设置文件损坏，使用默认值');
    }
  }
  
  // 返回默认设置
  return {
    theme: 'dark',
    memory: 2048,
    javaPath: '',
    username: 'Player',
    minecraftDir: CONFIG.minecraftDir,
    language: 'zh-CN',
  };
}

// 扫描已安装版本
async function scanInstalledVersions() {
  const versions = [];
  
  if (!fs.existsSync(CONFIG.versionsDir)) {
    return versions;
  }

  try {
    const dirs = fs.readdirSync(CONFIG.versionsDir);
    
    for (const dir of dirs) {
      const jsonPath = path.join(CONFIG.versionsDir, dir, `${dir}.json`);
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const jarPath = path.join(CONFIG.versionsDir, dir, `${dir}.jar`);
          versions.push({
            id: data.id || dir,
            type: data.type || 'release',
            installed: true,
            hasJar: fs.existsSync(jarPath),
            path: path.join(CONFIG.versionsDir, dir),
            gameVersion: data.id,
          });
        } catch (e) {
          // 忽略无效版本
        }
      }
    }
  } catch (e) {
    console.error('扫描版本失败:', e);
  }

  return versions;
}

// 工具函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 工具函数：生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 应用启动
app.whenReady().then(() => {
  initializeApp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    initializeApp();
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
      try {
        const exitNote = new Notification({
          title: 'Minecraft 已退出',
          body: code === 0 ? '游戏已正常结束' : `游戏进程退出，代码: ${code}`,
        });
        exitNote.show();
      } catch (e) {
        console.error('退出通知失败:', e);
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

// 5.5 显示 Windows 原生通知（Toast）
ipcMain.handle('notify', (event, options) => {
  try {
    const notification = new Notification({
      title: options.title || 'MagicianPCL',
      body: options.body || '',
      icon: path.join(__dirname, '..', 'renderer', 'assets', 'icon.ico'),
      silent: options.silent || false,
    });
    notification.show();
    return { success: true };
  } catch (error) {
    console.error('通知失败:', error);
    return { success: false, error: error.message };
  }
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
    exec('java -version 2>&1', (error, stdout, stderr) => {
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

// 10. 获取初始化信息（用于前端显示）
ipcMain.handle('get-init-info', () => {
  return {
    minecraftDir: CONFIG.minecraftDir,
    launcherDir: CONFIG.launcherDir,
  };
});

// ============ API 接口 ============

// 11. 搜索模组/资源包/光影包/整合包
ipcMain.handle('search-projects', async (event, query, options) => {
  try {
    const result = await ModrinthAPI.searchProjects(query, options);
    return result;
  } catch (error) {
    return { hits: [], total_hits: 0, error: error.message };
  }
});

// 12. 获取项目详情
ipcMain.handle('get-project', async (event, projectId) => {
  try {
    const project = await ModrinthAPI.getProject(projectId);
    return project;
  } catch (error) {
    return null;
  }
});

// 13. 获取项目版本
ipcMain.handle('get-project-versions', async (event, projectId, options) => {
  try {
    const versions = await ModrinthAPI.getVersions(projectId, options);
    return versions;
  } catch (error) {
    return [];
  }
});

// 14. 下载模组/资源包
ipcMain.handle('download-mod', async (event, downloadUrl, fileName, type = 'mods') => {
  try {
    const targetDir = type === 'mods' ? 
      path.join(CONFIG.minecraftDir, 'mods') :
      type === 'resourcepacks' ?
      path.join(CONFIG.minecraftDir, 'resourcepacks') :
      type === 'shaderpacks' ?
      path.join(CONFIG.minecraftDir, 'shaderpacks') :
      CONFIG.minecraftDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    const writer = fs.createWriteStream(filePath);

    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return { success: true, path: filePath };
  } catch (error) {
    console.error('下载失败:', error);
    return { success: false, error: error.message };
  }
});

// 15. 获取 Minecraft 游戏版本列表
ipcMain.handle('get-game-versions', async () => {
  try {
    const manifest = await MinecraftAPI.getVersionManifest();
    return manifest;
  } catch (error) {
    return { versions: [], error: error.message };
  }
});

// 16. 下载 Minecraft 游戏本体
ipcMain.handle('download-game', async (event, versionId) => {
  try {
    const manifest = await MinecraftAPI.getVersionManifest();
    const version = manifest.versions.find(v => v.id === versionId);
    
    if (!version) {
      return { success: false, error: '未找到该版本' };
    }

    const versionDetails = await MinecraftAPI.getVersionDetails(version.url);
    
    // 创建版本目录
    const versionDir = path.join(CONFIG.versionsDir, versionId);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    // 保存版本 JSON
    fs.writeFileSync(
      path.join(versionDir, `${versionId}.json`),
      JSON.stringify(versionDetails, null, 2)
    );

    // 下载客户端 JAR
    if (versionDetails.downloads && versionDetails.downloads.client) {
      const clientUrl = versionDetails.downloads.client.url;
      const clientPath = path.join(versionDir, `${versionId}.jar`);
      const clientSha1 = versionDetails.downloads.client.sha1;

      // 通知前端进度
      const writer = fs.createWriteStream(clientPath);
      const response = await axios({
        method: 'GET',
        url: clientUrl,
        responseType: 'stream',
      });

      let downloaded = 0;
      const total = parseInt(response.headers['content-length'] || '0');

      response.data.on('data', (chunk) => {
        downloaded += chunk.length;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            version: versionId,
            progress: Math.round((downloaded / total) * 100),
            stage: 'client'
          });
        }
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // 验证 SHA1
      // TODO: 实现校验
    }

    // 下载库文件
    if (versionDetails.libraries) {
      let libraryIndex = 0;
      const totalLibraries = versionDetails.libraries.length;

      for (const lib of versionDetails.libraries) {
        if (lib.downloads && lib.downloads.artifact) {
          const libUrl = lib.downloads.artifact.url;
          const libPath = path.join(CONFIG.librariesDir, lib.downloads.artifact.path);
          const libDir = path.dirname(libPath);

          if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
          }

          if (!fs.existsSync(libPath)) {
            try {
              const libWriter = fs.createWriteStream(libPath);
              const libResponse = await axios({
                method: 'GET',
                url: libUrl,
                responseType: 'stream',
              });

              libResponse.data.pipe(libWriter);

              await new Promise((resolve, reject) => {
                libWriter.on('finish', resolve);
                libWriter.on('error', reject);
              });
            } catch (e) {
              console.warn(`下载库失败: ${libUrl}`, e.message);
            }
          }

          libraryIndex++;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-progress', {
              version: versionId,
              progress: Math.round((libraryIndex / totalLibraries) * 100),
              stage: 'libraries'
            });
          }
        }
      }
    }

    // 下载资源文件索引
    if (versionDetails.assetIndex) {
      const assetIndexPath = path.join(CONFIG.assetsDir, 'indexes', `${versionDetails.assetIndex.id}.json`);
      const assetIndexDir = path.dirname(assetIndexPath);
      if (!fs.existsSync(assetIndexDir)) {
        fs.mkdirSync(assetIndexDir, { recursive: true });
      }

      const assetIndexResponse = await axios.get(versionDetails.assetIndex.url);
      fs.writeFileSync(assetIndexPath, JSON.stringify(assetIndexResponse.data, null, 2));

      // 下载资源文件（可选，可以边玩边下载）
      // TODO: 实现资源文件下载
    }

    return { success: true, versionId };
  } catch (error) {
    console.error('下载游戏失败:', error);
    return { success: false, error: error.message };
  }
});

// 17. 获取 Forge 版本列表
ipcMain.handle('get-forge-versions', async () => {
  try {
    const versions = await ForgeAPI.getForgeVersions();
    return versions;
  } catch (error) {
    return { error: error.message };
  }
});

// 18. 获取 Fabric 版本列表
ipcMain.handle('get-fabric-versions', async () => {
  try {
    const [gameVersions, loaderVersions] = await Promise.all([
      FabricAPI.getFabricVersions(),
      FabricAPI.getLoaderVersions()
    ]);
    return { gameVersions, loaderVersions };
  } catch (error) {
    return { gameVersions: [], loaderVersions: [], error: error.message };
  }
});

// 19. 获取 Modrinth 游戏版本列表
ipcMain.handle('get-modrinth-game-versions', async () => {
  try {
    const versions = await ModrinthAPI.getGameVersions();
    return versions;
  } catch (error) {
    return [];
  }
});

// 20. 扫描已安装的模组
ipcMain.handle('scan-installed-mods', async (event, versionId) => {
  try {
    const modsDir = path.join(CONFIG.minecraftDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));
    const mods = [];

    for (const file of files) {
      const filePath = path.join(modsDir, file);
      const stats = fs.statSync(filePath);
      
      mods.push({
        id: file.replace('.jar', ''),
        name: file.replace('.jar', ''),
        fileName: file,
        size: stats.size,
        installed: true,
        path: filePath
      });
    }

    return mods;
  } catch (error) {
    return [];
  }
});

// 21. 扫描资源包
ipcMain.handle('scan-resourcepacks', async () => {
  try {
    const rpDir = path.join(CONFIG.minecraftDir, 'resourcepacks');
    if (!fs.existsSync(rpDir)) {
      fs.mkdirSync(rpDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(rpDir).filter(f => f.endsWith('.zip'));
    return files.map(f => ({
      name: f.replace('.zip', ''),
      fileName: f,
      path: path.join(rpDir, f)
    }));
  } catch (error) {
    return [];
  }
});

// 22. 扫描光影包
ipcMain.handle('scan-shaderpacks', async () => {
  try {
    const spDir = path.join(CONFIG.minecraftDir, 'shaderpacks');
    if (!fs.existsSync(spDir)) {
      fs.mkdirSync(spDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(spDir).filter(f => f.endsWith('.zip'));
    return files.map(f => ({
      name: f.replace('.zip', ''),
      fileName: f,
      path: path.join(spDir, f)
    }));
  } catch (error) {
    return [];
  }
});


// ���������������
require('./lan_handlers');
