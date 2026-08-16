// ===== 设置管理器 =====
const SettingsManager = {
  settings: {},

  async init() {
    await this.loadSettings();
    this.setupUI();
    this.setupEvents();
  },

  async loadSettings() {
    try {
      this.settings = await window.electronAPI.loadSettings();
      document.getElementById('setting-theme').value = this.settings.theme || 'dark';
      document.getElementById('setting-username').value = this.settings.username || 'Player';
      document.getElementById('setting-memory').value = this.settings.memory || 2048;
      document.getElementById('setting-java').value = this.settings.javaPath || '自动检测';
      document.getElementById('setting-mc-dir').value = this.settings.minecraftDir || '';
      document.getElementById('launch-username').value = this.settings.username || 'Player';
      document.getElementById('launch-memory').value = this.settings.memory || 2048;
    } catch (e) {
      console.warn('加载设置失败:', e);
    }
  },

  setupUI() {
    window.electronAPI.getJavaVersion().then(info => {
      const javaInput = document.getElementById('setting-java');
      if (info.available) {
        javaInput.value = `Java ${info.version} (已检测)`;
      } else {
        javaInput.value = '未检测到 Java';
      }
    });
  },

  setupEvents() {
    document.getElementById('btn-browse-java')?.addEventListener('click', async () => {
      const path = await window.electronAPI.selectDirectory();
      if (path) document.getElementById('setting-java').value = path;
    });

    document.getElementById('btn-browse-mc')?.addEventListener('click', async () => {
      const path = await window.electronAPI.selectDirectory();
      if (path) document.getElementById('setting-mc-dir').value = path;
    });

    document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
      const settings = {
        theme: document.getElementById('setting-theme').value,
        username: document.getElementById('setting-username').value.trim() || 'Player',
        memory: parseInt(document.getElementById('setting-memory').value) || 2048,
        javaPath: document.getElementById('setting-java').value === '自动检测' ? '' : document.getElementById('setting-java').value,
        minecraftDir: document.getElementById('setting-mc-dir').value,
        language: 'zh-CN',
      };

      const result = await window.electronAPI.saveSettings(settings);
      if (result.success) {
        this.settings = settings;
        document.body.className = settings.theme === 'auto' ? 'auto-theme' : `${settings.theme}-theme`;
        document.getElementById('launch-username').value = settings.username;
        document.getElementById('launch-memory').value = settings.memory;
        App.updateUsernameDisplay();
        App.appendConsole('✅ 设置已保存', 'success');
        alert('✅ 设置已保存！');
      } else {
        alert(`❌ 保存失败: ${result.error}`);
      }
    });

    document.getElementById('link-github')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://github.com');
    });

    document.getElementById('link-license')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://github.com');
    });
  },
};
