
---

```markdown
<div align="center">

# 🧙 MagicianPCL

### 轻量 · 高效 · 开源 —— 专为 Windows 平台设计的 Minecraft 启动器

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com)
[![License](https://img.shields.io/badge/license-CaelLab%20BY--SA-green?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078d7?style=for-the-badge)](https://github.com)
[![Electron](https://img.shields.io/badge/Electron-30.0.0-47848f?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com)

</div>

---

## 📖 目录

- [简介](#-简介)
- [核心特性](#-核心特性)
- [系统要求](#-系统要求)
- [下载与安装](#-下载与安装)
- [功能预览](#-功能预览)
- [技术架构](#-技术架构)
- [开发指南](#-开发指南)
- [开源许可证](#-开源许可证)
- [贡献指南](#-贡献指南)
- [常见问题](#-常见问题)
- [相关链接](#-相关链接)
- [致谢](#-致谢)

---

## 📖 简介

**MagicianPCL**（简称 **MPCL**）是一款轻量级 Minecraft 启动器，由 MagicianPCL Team 开发并维护。项目致力于为玩家提供简洁、直观且高效的游戏启动体验，在保持功能完整性的同时，将启动器自身的资源占用控制在极低水平。

在登录方式上，MPCL 同时支持 **离线登录** 与 **正版登录** 两种模式，无论您是否拥有正版 Minecraft 账号，都能顺畅进入游戏。在版本管理方面，MPCL 内置了完整的版本自动管理机制，用户只需点击按钮，即可完成游戏版本的下载、安装与切换，启动器会自动解析并处理所有依赖库及资源文件，无需手动干预。

此外，MPCL 在启动性能上做了大量优化。通过改进启动流程、引入缓存机制，显著缩短了从点击启动到进入游戏主界面的等待时间。

> 🚀 **最新版本：v1.0.0** | 发布日期：2026年8月

---

## ✨ 核心特性

| 功能模块 | 描述 |
|---------|------|
| 🔐 **双模式登录** | 同时支持离线模式与正版账号登录，兼顾不同用户群体的使用习惯与需求 |
| 📦 **智能版本管理** | 一键完成游戏版本的下载、安装与切换，自动解析并处理所有依赖库及原生资源文件 |
| 🚀 **极速启动引擎** | 通过优化的启动流程与多层次缓存机制，大幅缩短启动等待时间 |
| ☕ **Java 运行时管理** | 自动检测系统 Java 运行环境，提供友好的状态提示 |
| 🎨 **视觉主题适配** | 完整支持浅色模式、深色模式以及跟随系统偏好，提供一致的视觉体验 |
| 🔄 **自动更新与维护** | 内置更新检测机制，保持启动器长期整洁高效 |
| 📟 **实时日志输出** | 游戏运行日志实时显示，方便排查问题 |
| 🧩 **模组支持（规划中）** | 未来将支持 Forge、Fabric、OptiFine 等主流模组加载器 |

---

## 🖥️ 系统要求

在安装 MPCL 之前，请确保您的计算机满足以下最低配置要求：

| 项目 | 要求 |
|------|------|
| **操作系统** | Windows 10 64位（版本 1709 及以上）或 Windows 11 |
| **Java 运行时** | Java 8 或更高版本（启动器会自动检测） |
| **磁盘空间** | 启动器本体约 90 MB（不包含 Minecraft 游戏本体） |
| **内存** | 建议 2 GB 以上可用内存 |
| **网络** | 首次启动需要互联网连接以下载版本列表 |

---

## 📥 下载与安装

### 方式一：下载安装包（推荐）

请前往 **[GitHub Releases](https://github.com)** 页面下载对应版本的最新安装包。

| 版本 | 发布日期 | 下载 |
|------|---------|------|
| v1.0.0 | 2026-08-16 | [下载](https://github.com) |

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/MagicianPCL.git
cd MagicianPCL

# 安装依赖
npm install

# 启动开发模式
npm start

# 打包为 Windows 安装程序
npm run dist:win
```

### 首次启动

首次启动时，启动器会自动进行必要的初始化配置：
1. 创建 `.minecraft` 目录（位于 `%APPDATA%`）
2. 加载远程版本列表
3. 检测系统 Java 环境
4. 展示欢迎界面

---

## 🖼️ 功能预览

### 主界面 - 启动页

启动页是 MPCL 的核心入口，包含：
- **版本选择器**：下拉选择已安装的游戏版本
- **玩家名输入**：自定义离线模式下的玩家名称
- **内存分配**：调整游戏可用的内存大小
- **启动按钮**：一键启动游戏
- **实时日志**：显示游戏运行输出

### 版本管理

集中管理所有已安装的游戏版本：
- 显示已安装版本列表
- 支持一键启动指定版本
- 版本类型标识（正式版/快照版等）

### 下载中心

分类展示可下载的游戏版本：
- 支持按类型筛选（全部/正式版/快照版/Beta/Alpha）
- 一键安装新版本
- 显示安装进度与状态

### 设置面板

整合五大配置模块：
- 🎨 **外观设置**：主题切换（深色/浅色/跟随系统）
- 🎮 **游戏设置**：默认玩家名、默认内存分配
- ☕ **Java 设置**：自定义 Java 路径
- 📁 **目录设置**：自定义 `.minecraft` 路径
- ℹ️ **关于信息**：版本信息与相关链接

---

## 🏗️ 技术架构

### 技术栈概览

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **桌面框架** | Electron 30.0.0 | 跨平台桌面应用框架 |
| **前端语言** | HTML5 + CSS3 + JavaScript (ES6+) | 原生实现，无需额外框架 |
| **进程通信** | Electron IPC | 主进程与渲染进程安全通信 |
| **游戏启动** | Node.js child_process | 调用系统 Java 启动游戏 |
| **版本管理** | Mojang Launcher Meta API | 获取官方版本清单 |
| **打包工具** | Electron Builder | 构建 Windows 安装程序 |

### 目录结构

```
MagicianPCL/
├── src/
│   ├── main/                    # 主进程
│   │   ├── main.js              # 应用入口
│   │   └── preload.js           # 预加载脚本（安全桥接）
│   ├── renderer/                # 渲染进程（前端）
│   │   ├── index.html           # 主页面
│   │   ├── css/
│   │   │   ├── style.css        # 主样式
│   │   │   └── themes.css       # 主题样式
│   │   ├── js/
│   │   │   ├── app.js           # 应用主控制器
│   │   │   ├── launcher.js      # 启动核心逻辑
│   │   │   ├── version.js       # 版本管理逻辑
│   │   │   └── settings.js      # 设置管理逻辑
│   │   └── assets/
│   │       └── icon.ico         # 应用图标
├── package.json                 # 项目配置
├── README.md                    # 项目说明
└── LICENSE                      # 许可证
```

### 核心机制

| 机制 | 说明 |
|------|------|
| **版本隔离** | 各游戏版本独立存储于 `versions` 目录，互不干扰 |
| **依赖自动解析** | 根据版本 JSON 自动下载所需 libraries |
| **进程生命周期管理** | 完整监控游戏进程的启动、运行与退出 |
| **日志实时输出** | 通过 IPC 将游戏日志实时推送至前端控制台 |
| **配置持久化** | 用户设置保存为 `settings.json` 文件 |

---

## 🛠️ 开发指南

### 环境准备

```bash
# 1. 确保已安装 Node.js (v18+)
node --version

# 2. 克隆项目
git clone https://github.com/your-username/MagicianPCL.git
cd MagicianPCL

# 3. 安装依赖
npm install
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发模式，打开 Electron 应用 |
| `npm run dist:win` | 打包 Windows 安装程序 (NSIS) |
| `npm run dist` | 打包所有平台（根据配置） |

### 调试技巧

1. **开启 DevTools**：在 `main.js` 中取消注释 `mainWindow.webContents.openDevTools();`
2. **查看日志**：应用日志输出在控制台（终端）
3. **游戏日志**：在启动器界面底部控制台查看

### 编码规范

- 使用 ES6+ 语法
- 保持代码风格一致（使用 ESLint 可自动检查）
- 提交前确保功能正常
- Commit 信息格式：`<type>: <subject>`（如 `feat: 添加正版登录支持`）

---

## 📄 开源许可证

本项目采用 **CaelLab BY-SA Code License** 进行授权，该许可证基于知识共享署名-相同方式共享（CC BY-SA）理念设计，适用于代码类作品。其核心条款如下：

- ✅ 允许自由使用、复制、修改、合并、发布、分发、再许可及销售本软件，无论用于个人、商业还是非商业目的
- ✅ 如果您分发本软件或其衍生作品，必须同时提供完整的对应源代码
- ✅ 所有副本或实质性衍生作品中，必须完整保留原始版权声明与许可声明
- ✅ 任何衍生作品必须以相同的许可证进行发布，不得改变开源性质

📄 [查看完整许可证全文](LICENSE)

---

## 🤝 贡献指南

MPCL 是一个社区驱动的开源项目，我们非常欢迎并感谢所有形式的贡献！

### 贡献类型

| 类型 | 说明 |
|------|------|
| 🐛 **Bug 报告** | 发现 Bug 请提交 Issue，详细描述复现步骤 |
| 💡 **功能建议** | 有好的想法？欢迎提出 Feature Request |
| 💻 **代码贡献** | Fork 仓库 -> 修改代码 -> 提交 Pull Request |
| 📝 **文档完善** | 改进 README、添加使用教程、翻译文档 |
| 🧪 **测试反馈** | 在不同环境下测试并提供反馈 |

### 提交流程

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'feat: 添加某个很棒的功能'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

> ⚠️ **注意**：提交代码前请确保本地构建通过，并遵守项目的编码规范。

---

## ❓ 常见问题

<details>
<summary><b>Q：启动时提示 Java 未找到怎么办？</b></summary>

MPCL 会自动检测系统 Java。如遇问题，请：
1. 检查是否已安装 Java 8 或更高版本
2. 在设置中手动指定 Java 安装路径
3. 确认 Java 已添加到系统 PATH 环境变量
</details>

<details>
<summary><b>Q：首次启动时版本列表加载失败？</b></summary>

请检查网络连接，确保能够访问 Mojang API。如网络受限，可尝试：
1. 检查防火墙设置
2. 使用 VPN 或代理
3. 稍后重试
</details>

<details>
<summary><b>Q：下载版本时速度很慢怎么办？</b></summary>

版本文件从 Mojang 官方源下载，速度受网络环境影响。建议：
1. 避开网络高峰期
2. 使用稳定的网络连接
3. 耐心等待，大文件下载可能需要一定时间
</details>

<details>
<summary><b>Q：是否支持 macOS 或 Linux？</b></summary>

当前版本仅支持 Windows 10/11 64位系统。后续是否支持其他平台将视社区需求与开发资源而定。
</details>

<details>
<summary><b>Q：如何切换离线模式与正版模式？</b></summary>

正版登录功能当前为预留接口，完整实现需添加微软 OAuth 认证流程。目前默认使用离线模式，您可以在设置中自定义玩家名称。
</details>

---

## 🔗 相关链接

| 资源 | 地址 |
|------|------|
| GitHub 主仓库 | https://github.com/MagiciansWand/MagicianPCL |
| 问题反馈 | https://github.com/MagiciansWand/MagicianPCL/issues |
| 许可证文本 | [LICENSE](LICENSE) |

---

## 🙏 致谢

- **开发者**：Duck
- **技术社区**：Electron、Mojang API 等开源项目
- **所有贡献者**：感谢每一位通过 Issue 和 Pull Request 参与贡献的开发者与热心玩家

---

<div align="center">

**Made with ❤️ by MagicianPCL Team**

*如果觉得这个项目对你有帮助，请给个 ⭐ Star 支持一下！*

</div>
```
##爱发电https://ifdian.net/a/duck666##
---

