// ===== 启动器核心 =====
const Launcher = {
  isRunning: false,
  currentVersion: null,

  init() {
    const btn = document.getElementById('btn-launch');
    btn.addEventListener('click', () => this.launch());

    document.getElementById('version-select')?.addEventListener('change', (e) => {
      this.currentVersion = e.target.value;
    });
  },

  async launch() {
    if (this.isRunning) {
      this.setStatus('游戏正在运行中...', 'running');
      return;
    }

    const version = document.getElementById('version-select')?.value;
    if (!version) {
      this.setStatus('请选择一个版本', 'error');
      return;
    }

    const username = document.getElementById('launch-username')?.value.trim() || 'Player';
    const memory = parseInt(document.getElementById('launch-memory')?.value || '2048');
    const accountSel = document.getElementById('account-select');
    const accountId = accountSel && accountSel.value !== 'offline' ? accountSel.value : null;

    // 保存用户名
    const settings = await window.electronAPI.loadSettings();
    settings.username = username;
    await window.electronAPI.saveSettings(settings);
    App.updateUsernameDisplay();

    this.setStatus('正在启动...', 'running');
    this.showProgress(true);
    this.updateProgress(10, '准备环境...');

    try {
      const javaInfo = await window.electronAPI.getJavaVersion();
      if (!javaInfo.available) {
        this.setStatus('未找到 Java，请安装 Java 8 或更高版本', 'error');
        this.showProgress(false);
        return;
      }
      this.updateProgress(30, `Java 版本: ${javaInfo.version}`);

      const result = await window.electronAPI.launchGame({
        versionId: version,
        username: username,
        uuid: this.generateUUID(),
        memory: memory,
        javaPath: '',
        accountId: accountId,
      });

      if (result.success) {
        this.isRunning = true;
        this.setStatus('游戏运行中 🎮', 'running');
        this.updateProgress(100, '✅ 游戏已启动');
        document.getElementById('btn-launch').innerHTML = '<span class="btn-icon">⏹</span> 正在运行';
        App.appendConsole(`🚀 启动版本: ${version} (内存: ${memory}MB)`, 'info');
      } else {
        this.setStatus(`启动失败: ${result.error}`, 'error');
        this.showProgress(false);
        App.appendConsole(`❌ 启动失败: ${result.error}`, 'error');
      }
    } catch (e) {
      this.setStatus(`启动异常: ${e.message}`, 'error');
      this.showProgress(false);
      App.appendConsole(`⚠️ 启动异常: ${e.message}`, 'error');
    }
  },

  setStatus(text, type = '') {
    const el = document.getElementById('launch-status').querySelector('.status-text');
    if (el) {
      el.textContent = text;
      el.className = `status-text ${type}`;
    }
  },

  showProgress(show) {
    document.getElementById('launch-progress').style.display = show ? 'block' : 'none';
  },

  updateProgress(percent, text) {
    document.getElementById('progress-fill').style.width = `${Math.min(100, percent)}%`;
    document.getElementById('progress-text').textContent = text || `${Math.min(100, percent)}%`;
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  reset() {
    this.isRunning = false;
    this.setStatus('就绪', '');
    document.getElementById('btn-launch').innerHTML = '<span class="btn-icon">▶</span> 启动游戏';
    this.showProgress(false);
  },
};

window.electronAPI.onGameExit((code) => {
  Launcher.reset();
});
