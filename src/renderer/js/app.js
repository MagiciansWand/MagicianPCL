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
    AuthManager.init();
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
      workspace: document.getElementById('tab-workspace'),
      lan: document.getElementById('tab-lan'),
      assistant: document.getElementById('tab-assistant'),
      about: document.getElementById('tab-about'),
      settings: document.getElementById('tab-settings'),
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        console.log('Tab clicked:', tab);
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        Object.keys(tabContents).forEach(key => {
          if (tabContents[key]) {
            tabContents[key].classList.toggle('active', key === tab);
          }
        });
        
        this.currentTab = tab;
        
        // 懒加载初始化
        if (tab === 'workspace' && typeof ModsManager !== 'undefined' && !ModsManager._initialized) {
          console.log('Initializing ModsManager...');
          ModsManager.init();
          // 工作台子标签切换
          const wsTabs = document.querySelectorAll('.ws-tab');
          const subcontents = document.querySelectorAll('.ws-subcontent');
          wsTabs.forEach(t => {
            t.addEventListener('click', () => {
              wsTabs.forEach(x => x.classList.remove('active'));
              subcontents.forEach(x => x.classList.remove('active'));
              t.classList.add('active');
              const sub = t.dataset.subtab;
              const target = document.getElementById('ws-' + sub);
              if (target) target.classList.add('active');
            });
          });
        }
        if (tab === 'versions' && typeof VersionManager !== 'undefined') {
          VersionManager.init();
        }
        if (tab === 'lan' && typeof LANManager !== 'undefined' && !LANManager._initialized) {
          LANManager.init();
          LANManager._initialized = true;
        }
        if (tab === 'assistant' && typeof AssistantManager !== 'undefined' && !AssistantManager._initialized) {
          AssistantManager.init();
          AssistantManager._initialized = true;
        }
      });
    });

    // 默认启动页
    const defaultTab = document.querySelector('.nav-item[data-tab="launch"]');
    if (defaultTab) {
      defaultTab.classList.add('active');
    }
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

// ===== 正版账号管理器 =====
const AuthManager = {
  accounts: [],
  pollTimer: null,

  async init() {
    await this.loadAccounts();
    this.bindEvents();
  },

  async loadAccounts() {
    try {
      this.accounts = await window.electronAPI.getAccounts();
      const sel = document.getElementById('account-select');
      if (!sel) return;
      sel.innerHTML = '<option value="offline">离线模式（输入玩家名）</option>';
      this.accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name + '（正版）';
        sel.appendChild(opt);
      });
      this.updateAccountUI();
    } catch (e) { console.warn('加载账号失败', e); }
  },

  updateAccountUI() {
    const sel = document.getElementById('account-select');
    const removeBtn = document.getElementById('btn-remove-account');
    const uname = document.getElementById('launch-username');
    if (!sel) return;
    const isOffline = sel.value === 'offline';
    if (removeBtn) removeBtn.style.display = isOffline ? 'none' : 'inline-block';
    if (uname) uname.disabled = !isOffline;
  },

  bindEvents() {
    const addBtn = document.getElementById('btn-add-account');
    const removeBtn = document.getElementById('btn-remove-account');
    const sel = document.getElementById('account-select');
    const cancelBtn = document.getElementById('btn-ms-cancel');
    if (addBtn) addBtn.addEventListener('click', () => this.openAuth());
    if (removeBtn) removeBtn.addEventListener('click', () => this.removeCurrent());
    if (sel) sel.addEventListener('change', () => this.updateAccountUI());
    if (cancelBtn) cancelBtn.addEventListener('click', () => { this.stopPoll(); document.getElementById('ms-auth-modal').style.display = 'none'; });
  },

  stopPoll() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  },

  async openAuth() {
    const modal = document.getElementById('ms-auth-modal');
    const statusEl = document.getElementById('ms-auth-status');
    const codeEl = document.getElementById('ms-user-code');
    const urlEl = document.getElementById('ms-verify-url');
    if (!modal) return;

    const clientId = (document.getElementById('setting-client-id')?.value || '').trim();
    const data = await window.electronAPI.startMicrosoftAuth(clientId || null);
    if (data.error) { alert('发起登录失败: ' + data.error); return; }
    codeEl.textContent = data.user_code;
    urlEl.href = data.verification_uri;
    urlEl.textContent = data.verification_uri;
    statusEl.textContent = '等待你在浏览器中授权...';
    statusEl.className = 'ms-status';
    modal.style.display = 'flex';

    const deviceCode = data.device_code;
    const interval = (data.interval || 5) * 1000;
    const expiresAt = Date.now() + (data.expires_in || 900) * 1000;
    this.stopPoll();
    this.pollTimer = setInterval(async () => {
      if (Date.now() > expiresAt) {
        this.stopPoll();
        statusEl.textContent = '登录超时，请重试';
        statusEl.className = 'ms-status error';
        return;
      }
      const res = await window.electronAPI.pollMicrosoftAuth({ clientId: clientId || null, deviceCode });
      if (res.pending) return;
      this.stopPoll();
      if (res.error) {
        statusEl.textContent = '登录失败: ' + res.error;
        statusEl.className = 'ms-status error';
        return;
      }
      const account = {
        id: res.uuid,
        name: res.name,
        uuid: res.uuid,
        mcToken: res.mcToken,
        refreshToken: res.refreshToken,
        clientId: res.clientId,
        addedAt: Date.now(),
      };
      await window.electronAPI.saveAccount(account);
      await window.electronAPI.setActiveAccount(account.id);
      statusEl.textContent = '✅ 登录成功：' + res.name;
      statusEl.className = 'ms-status success';
      await this.loadAccounts();
      this.updateAccountUI();
      document.getElementById('account-select').value = account.id;
      setTimeout(() => { modal.style.display = 'none'; }, 1200);
    }, interval);
  },

  async removeCurrent() {
    const sel = document.getElementById('account-select');
    if (!sel || sel.value === 'offline') return;
    if (!confirm('确定删除当前正版账号？')) return;
    await window.electronAPI.removeAccount(sel.value);
    await this.loadAccounts();
    this.updateAccountUI();
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
