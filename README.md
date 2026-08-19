# 🧙 MagicianPCL

轻量 · 高效 · 开源 —— 一款专为 Windows 平台设计的 Minecraft 启动器

---

## 📖 简介

**MagicianPCL**（简称 MPCL）是一款轻量级 Minecraft 启动器，致力于为玩家提供简洁、直观且高效的游戏启动体验。在保持功能完整性的同时，将启动器自身的资源占用控制在极低水平。

当前版本：**v1.2.5**

---

## ✨ 核心特性

| 功能模块 | 描述 |
|---------|------|
| 🎮 极速启动 | 一键启动游戏，优化的启动流程，缩短等待时间 |
| 🔐 正版登录 | 支持 Microsoft 账号登录（OAuth 2.0 设备码），自动刷新 token |
| 📦 版本管理 | 一键下载、安装与切换游戏版本（正式版/快照/Beta/Alpha） |
| 🔧 模组管理 | Modrinth 模组库集成，搜索、筛选、一键安装 |
| 🎨 资源包 & 光影包 | 支持资源包、光影包的管理与安装 |
| 📦 整合包 | 整合包解析与导入支持 |
| 🌐 局域网联机 | 自动发现局域网玩家，一键加入房间，UDP 广播发现 |
| 🧙 Magician 助手 | 内置 AI 助手，查询 Minecraft Wiki，解答游戏问题 |
| ☕ Java 运行时管理 | 自动检测 Java 环境，支持自定义路径 |
| 🎨 视觉主题适配 | 深色/浅色/黄金主题/跟随系统，流畅动画效果 |
| 📊 玻璃拟态界面 | 现代化 UI 设计，毛玻璃效果、渐变、流畅动画 |
| 🔔 Windows 原生通知 | 版本下载完成、模组安装、玩家发现、游戏退出通知 |
| 🔄 自动更新 | 支持 GitHub / Gitee 双源，用户自选更新服务器 |
| 🔐 离线模式支持 | 无需账号即可启动游戏 |

---

## 🖥️ 系统要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10/11 64位 |
| Java 运行时 | Java 8 或更高版本（推荐 Java 17/21 用于新版 MC） |
| 磁盘空间 | 启动器本体 70MB+，游戏本体另需 200MB+ |
| 内存 | 建议 2GB+ |

---

## 📥 下载与安装

前往 [GitHub Releases](https://github.com/MagiciansWand/MagicianPCL/releases) 或 [Gitee Releases](https://gitee.com/magicianswand/MagicianPCL/releases) 下载最新安装包。

安装包为 NSIS 安装程序（约 68MB），支持：
- 自定义安装目录
- 创建桌面快捷方式
- 创建开始菜单快捷方式
- 自动更新检测

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm start

# 打包 Windows 安装包
npm run dist:win

# 打包便携版
npm run dist:portable
```

---

## 📁 项目结构

```
MPCL/
├── src/
│   ├── main/                      # 主进程（Electron 后端）
│   │   ├── main.js                # 主入口
│   │   ├── preload.js             # preload 桥接层
│   │   ├── api.js                 # API 封装（Modrinth/Minecraft/Forge/Fabric）
│   │   ├── auth_microsoft.js      # 微软账号登录
│   │   ├── lan_handlers.js        # 局域网联机处理
│   │   └── updater.js             # 自动更新（GitHub/Gitee 双源）
│   └── renderer/                  # 渲染进程（前端界面）
│       ├── index.html             # 主界面
│       ├── splash.html            # 启动画面
│       ├── css/                   # 样式文件（style.css / themes.css）
│       ├── js/                    # 功能模块
│       │   ├── app.js             # 应用主逻辑
│       │   ├── launcher.js        # 启动游戏
│       │   ├── version.js         # 版本管理
│       │   ├── settings.js        # 设置 + 自动更新 UI
│       │   ├── mods.js            # 模组管理
│       │   ├── lan.js             # 局域网联机
│       │   └── assistant.js       # Magician 助手
│       └── assets/                # 资源文件（图标/头像）
├── dist/                          # 打包产物
├── package.json                   # 项目配置
└── README.md                      # 本文件
```

---

## 🎯 技术栈

- **Electron** 30.5.1 - 跨平台桌面应用框架
- **原生 HTML/CSS/JS** - 无框架依赖，极致轻量
- **electron-builder** 24.13.3 - 打包工具
- **electron-updater** 6.2.1 - 自动更新
- **axios** 1.7.0 - HTTP 请求
- **Modrinth API** - 模组数据源
- **Minecraft 官方 API** - 版本清单与下载
- **Microsoft Identity** - 正版账号登录
- **Minecraft Wiki API** - Magician 助手数据源

---

## 🔄 自动更新说明

启动器内置自动更新功能，支持两个更新源：

| 更新源 | 适用场景 | 地址 |
|--------|----------|------|
| **GitHub** | 国际用户，访问稳定 | github.com/MagiciansWand/MagicianPCL |
| **Gitee** | 国内用户，下载加速 | gitee.com/magicianswand/MagicianPCL |

### 使用方式
1. 打开 **设置页 → 自动更新**
2. 选择更新源（默认 GitHub）
3. 点击「检查更新」按钮
4. 发现新版本时确认下载，自动重启安装

自动更新文件：`latest.yml`（版本信息） + `MagicianPCL Setup x.x.x.exe`（安装包）

---

## 📝 更新日志

### v1.2.5 (2026-08-19)
- 🔄 自动更新功能：支持 GitHub / Gitee 双源，用户自选更新服务器
- 📦 安装包体积优化：从 150MB 压缩到 **68MB**（优化 54.7%）
- 🌐 精简语言包：只保留中文+英文，排除其他 80+ 种语言
- ⚡ asar 打包优化：排除测试/文档/示例，体积降低 97%

### v1.2.4 (2026-08-19)
- 🔐 正版登录：Microsoft OAuth 2.0 设备码流程
- 👤 账号管理：多账号支持，自动刷新 token
- 🔧 Client ID 配置：支持自定义 Azure 应用 ID

### v1.2.3 (2026-08-17)
- ✨ 界面动画大改版：卡片入场动画、悬停效果、页面切换动画
- ✨ 新增黄金主题
- ✨ 启动页 Hero 进场动画、Logo 浮动效果
- ✨ 聊天气泡动画、打字指示器
- 🗑️ 移除 Windows Hello 功能

### v1.2.2 (2026-08-17)
- 🔔 新增 Windows 原生通知支持
- 🌐 局域网联机功能
- 🧙 Magician 助手（Minecraft Wiki 查询）

### v1.2.0 (2026-08-17)
- 📦 版本管理在线下载
- 🔧 模组管理（Modrinth API 集成）

### v1.1.0 (2026-08-17)
- 🎨 资源包/光影包/整合包支持
- 🎨 黄金主题
- 🔧 模组搜索与安装

### v1.0.0 (2026-08-16)
- 🎮 初始版本发布
- 📦 完整 Electron 启动器框架
- ☕ Java 自动检测
- 🎨 深色/浅色主题

---

## 📄 许可证

本项目采用 CaelLab BY-SA Code License 进行授权。

## 🙏 致谢

- 作者：**Duck**
- 基于 Electron 构建
- 鸣谢：GoodPlanCraftLauncher 及其作者 Yunyun（灵感来源）
- Made with ❤️
