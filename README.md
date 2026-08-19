# 🧙 MagicianPCL

轻量 · 高效 · 开源 —— 一款专为 Windows 平台设计的 Minecraft 启动器

---

## 📖 简介

**MagicianPCL**（简称 MPCL）是一款轻量级 Minecraft 启动器，致力于为玩家提供简洁、直观且高效的游戏启动体验。在保持功能完整性的同时，将启动器自身的资源占用控制在极低水平。

## ✨ 核心特性

| 功能模块 | 描述 |
|---------|------|
| 🎮 极速启动 | 一键启动游戏，优化的启动流程，缩短等待时间 |
| 📦 版本管理 | 一键下载、安装与切换游戏版本（支持正式版/快照/Beta/Alpha） |
| 🔧 模组管理 | Modrinth 模组库集成，搜索、筛选、一键安装 |
| 🎨 资源包 & 光影包 | 支持资源包、光影包的管理与安装 |
| 📦 整合包 | 整合包解析与导入支持 |
| 🌐 局域网联机 | 自动发现局域网玩家，一键加入房间，UDP 广播发现 |
| 🧙 Magician 助手 | 内置 AI 助手，查询 Minecraft Wiki，解答游戏问题 |
| ☕ Java 运行时管理 | 自动检测 Java 环境，支持自定义路径 |
| 🎨 视觉主题适配 | 深色/浅色/黄金主题/跟随系统，流畅动画效果 |
| 📊 玻璃拟态界面 | 现代化 UI 设计，毛玻璃效果、渐变、流畅动画 |
| 🔔 Windows 原生通知 | 版本下载完成、模组安装、玩家发现、游戏退出通知 |
| 🔐 离线模式支持 | 无需账号即可启动游戏 |

## 🖥️ 系统要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10/11 64位 |
| Java 运行时 | Java 8 或更高版本 |
| 磁盘空间 | 启动器本体 150MB+ |
| 内存 | 建议 2GB+ |

## 📥 下载与安装

前往 [Releases](https://github.com/MagiciansWand/MagicianPCL/releases) 下载最新安装包。

安装包为 NSIS 安装程序，支持：
- 自定义安装目录
- 创建桌面快捷方式
- 创建开始菜单快捷方式

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

## 📁 项目结构

```
MPCL/
├── src/
│   ├── main/              # 主进程（Electron 后端）
│   │   ├── main.js        # 主入口
│   │   ├── preload.js     # preload 桥接层
│   │   ├── api.js         # API 封装（Modrinth/Minecraft/Forge/Fabric）
│   │   └── lan_handlers.js # 局域网联机处理
│   └── renderer/          # 渲染进程（前端界面）
│       ├── index.html     # 主界面
│       ├── splash.html    # 启动画面
│       ├── css/           # 样式文件
│       ├── js/            # 功能模块
│       └── assets/        # 资源文件
├── dist/                  # 打包产物
├── package.json           # 项目配置
└── README.md              # 本文件
```

## 🎯 技术栈

- **Electron** 30.5.1 - 跨平台桌面应用框架
- **原生 HTML/CSS/JS** - 无框架依赖，极致轻量
- **electron-builder** 24.13.3 - 打包工具
- **Modrinth API** - 模组数据源
- **Minecraft 官方 API** - 版本清单与下载
- **Minecraft Wiki API** - Magician 助手数据源

## 📝 更新日志

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

## 📄 许可证

本项目采用 CaelLab BY-SA Code License 进行授权。

## 🙏 致谢

- 作者：**Duck**
- 基于 Electron 构建
- Made with ❤️
