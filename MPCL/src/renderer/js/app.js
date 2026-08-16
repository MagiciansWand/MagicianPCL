// ===== 应用主控制器 =====
const App = {
  currentTab: 'launch',
  settings: {},

  init() {
    this.loadSettings();
    this.setupTheme();
    this.setupTabs();
    this.setupTitleBar();
    this.setupConsole();
    this.updateUsernameDisplay();
  },

  async loadSettings() {
    try {
      this.settings = await window.electronAPI.loadSettings();
      const usernameInput = document.getElementById('launch-username');
      if (usernameInput && this.settings.username) {
        usernameInput.value = this.settings.username;
      }
    } catch (e) {
      console.warn('加载设置失败:', e);
    }
  },

  setupTheme() {
    const theme = this.settings.theme || 'dark';
    document.body.className = theme === 'auto' ? 'auto-theme' : `${theme}-theme`;
  },

  setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = {
      launch: document.getElementById('tab-launch'),
      versions: document.getElementById('tab-versions'),
      download: document.getElementById('tab-download'),
      settings: document.getElementById('tab-settings'),
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        Object.keys(tabContents).forEach(key => {
          tabContents[key].classList.toggle('active', key === tab);
        });
        this.currentTab = tab;

        if (tab === 'versions') VersionManager.refreshInstalled();
        if (tab === 'download') DownloadManager.loadVersions();
      });
    });
  },

  setupTitleBar() {
    document.getElementById('btn-minimize').addEventListener('click', () => window.electronAPI.minimize());
    document.getElementById('btn-maximize').addEventListener('click', () => window.electronAPI.maximize());
    document.getElementById('btn-close').addEventListener('click', () => window.electronAPI.close());
  },

  setupConsole() {
    window.electronAPI.onGameOutput((data) => {
      this.appendConsole(data, 'info');
    });

    window.electronAPI.onGameExit((code) => {
      if (code === 0) {
        this.appendConsole('✅ 游戏已正常退出', 'success');
      } else {
        this.appendConsole(`⚠️ 游戏异常退出，代码: ${code}`, 'error');
      }
      Launcher.setStatus('就绪', '');
    });

    document.getElementById('btn-clear-console').addEventListener('click', () => {
      document.getElementById('console-body').innerHTML = '';
    });
  },

  appendConsole(text, type = 'info') {
    const consoleBody = document.getElementById('console-body');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  },

  updateUsernameDisplay() {
    const nameEl = document.getElementById('display-username');
    const username = document.getElementById('launch-username')?.value || this.settings.username || 'Player';
    if (nameEl) nameEl.textContent = username.length > 8 ? username.substring(0, 8) + '…' : username;
  },
};

// ===== 下载管理器 =====
const DownloadManager = {
  allVersions: [],
  filteredVersions: [],

  async loadVersions() {
    const list = document.getElementById('download-list');
    list.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">加载中...</div>';

    try {
      const data = await window.electronAPI.getVersions();
      if (data.error) {
        list.innerHTML = `<div style="color:#ff7675;padding:20px;text-align:center;">${data.error}</div>`;
        return;
      }
      this.allVersions = data.versions || [];
      this.filter('all');

      // 绑定筛选按钮
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => this.filter(btn.dataset.filter));
      });
    } catch (e) {
      list.innerHTML = `<div style="color:#ff7675;padding:20px;text-align:center;">加载失败: ${e.message}</div>`;
    }
  },

  filter(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === type);
    });

    if (type === 'all') {
      this.filteredVersions = this.allVersions;
    } else {
      this.filteredVersions = this.allVersions.filter(v => v.type === type);
    }
    this.filteredVersions = this.filteredVersions.slice(0, 50);
    this.render();
  },

  render() {
    const list = document.getElementById('download-list');
    if (this.filteredVersions.length === 0) {
      list.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">暂无版本</div>';
      return;
    }

    list.innerHTML = this.filteredVersions.map(v => `
      <div class="download-item">
        <div class="dl-id">${v.id}</div>
        <div class="dl-type">${v.type}</div>
        <button class="dl-btn" data-version="${v.id}">⬇️ 安装</button>
        <span class="dl-status" id="dl-status-${v.id.replace(/[^a-zA-Z0-9]/g, '_')}">就绪</span>
      </div>
    `).join('');

    list.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const versionId = btn.dataset.version;
        const statusEl = document.getElementById(`dl-status-${versionId.replace(/[^a-zA-Z0-9]/g, '_')}`);
        btn.disabled = true;
        statusEl.textContent = '安装中...';

        const result = await window.electronAPI.installVersion(versionId);
        if (result.success) {
          statusEl.textContent = '✅ 已安装';
          VersionManager.refreshInstalled();
        } else {
          statusEl.textContent = `❌ ${result.error}`;
        }
        btn.disabled = false;
      });
    });
  },
};

// ===== 全局暴露 =====
window.App = App;
window.DownloadManager = DownloadManager;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  VersionManager.init();
  Launcher.init();
  SettingsManager.init();
  DownloadManager.loadVersions();

  document.getElementById('launch-username')?.addEventListener('input', () => {
    App.updateUsernameDisplay();
  });
});
