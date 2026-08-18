// ===== 版本管理器 =====
const VersionManager = {
  installedVersions: [],
  onlineVersions: [],
  downloading: new Map(),
  currentFilter: 'release',

  async init() {
    await this.refreshInstalled();
    await this.loadOnlineVersions();
    this.setupEventListeners();
    setInterval(() => this.refreshInstalled(), 30000);
  },

  setupEventListeners() {
    // 刷新按钮
    document.getElementById('btn-refresh-versions')?.addEventListener('click', () => {
      this.refreshInstalled();
    });

    // 标签页切换
    document.querySelectorAll('.v-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetTab = tab.dataset.tab;
        document.getElementById('v-installed').style.display = targetTab === 'installed' ? 'block' : 'none';
        document.getElementById('v-download').style.display = targetTab === 'download' ? 'block' : 'none';
        
        if (targetTab === 'download' && this.onlineVersions.length === 0) {
          this.loadOnlineVersions();
        }
      });
    });

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderOnlineVersions();
      });
    });
  },

  async refreshInstalled() {
    try {
      const versions = await window.electronAPI.getInstalledVersions();
      this.installedVersions = versions || [];
      this.updateSelectOptions();
      this.renderInstalledVersions();
      document.getElementById('versions-count').textContent = `已安装: ${this.installedVersions.length}`;
    } catch (e) {
      console.warn('刷新版本失败:', e);
    }
  },

  async loadOnlineVersions() {
    const list = document.getElementById('online-versions-list');
    if (!list) return;
    
    list.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">加载中...</div>';
    
    try {
      const manifest = await window.electronAPI.getGameVersions();
      if (manifest && manifest.versions) {
        this.onlineVersions = manifest.versions;
        this.renderOnlineVersions();
      }
    } catch (e) {
      list.innerHTML = `<div style="color:#ff7675;padding:20px;text-align:center;">加载失败: ${e.message}</div>`;
    }
  },

  updateSelectOptions() {
    const select = document.getElementById('version-select');
    if (!select) return;
    const currentValue = select.value;

    let options = '<option value="">-- 请选择版本 --</option>';
    const sorted = [...this.installedVersions].sort((a, b) => b.id.localeCompare(a.id));

    sorted.forEach(v => {
      const typeLabel = v.type === 'release' ? '正式' : v.type === 'snapshot' ? '快照' : v.type;
      options += `<option value="${v.id}">${v.id} (${typeLabel})</option>`;
    });

    select.innerHTML = options;
    if (currentValue && sorted.some(v => v.id === currentValue)) {
      select.value = currentValue;
    } else if (sorted.length > 0) {
      select.value = sorted[0].id;
    }
    Launcher.currentVersion = select.value;
  },

  renderInstalledVersions() {
    const grid = document.getElementById('versions-grid');
    if (!grid) return;

    if (this.installedVersions.length === 0) {
      grid.innerHTML = '<div style="color:#888;padding:20px;text-align:center;grid-column:1/-1;">暂无已安装版本，请前往"在线下载"安装</div>';
      return;
    }

    const sorted = [...this.installedVersions].sort((a, b) => b.id.localeCompare(a.id));
    grid.innerHTML = sorted.map(v => `
      <div class="version-card" data-version="${v.id}">
        <div class="version-id">${v.id}</div>
        <span class="version-type ${v.type}">${v.type}</span>
        <div class="version-actions">
          <button class="btn-launch-version" data-version="${v.id}">▶ 启动</button>
          <button class="btn-delete-version" data-version="${v.id}">🗑</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-launch-version').forEach(btn => {
      btn.addEventListener('click', () => {
        const versionId = btn.dataset.version;
        document.getElementById('version-select').value = versionId;
        Launcher.currentVersion = versionId;
        document.querySelector('.nav-item[data-tab="launch"]').click();
        Launcher.launch();
      });
    });

    grid.querySelectorAll('.btn-delete-version').forEach(btn => {
      btn.addEventListener('click', () => {
        const versionId = btn.dataset.version;
        if (confirm(`确定要删除版本 ${versionId} 吗？\n（注意：此操作仅提示，实际文件需手动清理）`)) {
          App.appendConsole(`🗑 删除提示: ${versionId}（请手动删除 .minecraft/versions/${versionId} 目录）`, 'info');
        }
      });
    });
  },

  renderOnlineVersions() {
    const list = document.getElementById('online-versions-list');
    if (!list) return;

    let filteredVersions = this.currentFilter === 'all' 
      ? this.onlineVersions 
      : this.onlineVersions.filter(v => v.type === this.currentFilter);
    
    filteredVersions = filteredVersions.slice(0, 50);

    if (filteredVersions.length === 0) {
      list.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">暂无版本</div>';
      return;
    }

    list.innerHTML = filteredVersions.map(v => {
      const isInstalled = this.installedVersions.some(i => i.id === v.id);
      const isDownloading = this.downloading.has(v.id);
      const safeId = v.id.replace(/[^a-zA-Z0-9]/g, '_');
      
      return `
        <div class="download-item" data-version="${v.id}">
          <div class="dl-id">${v.id}</div>
          <div class="dl-type">${v.type === 'release' ? '正式版' : '快照'}</div>
          <button class="dl-btn" ${isInstalled || isDownloading ? 'disabled' : ''} data-version="${v.id}">
            ${isInstalled ? '已安装' : isDownloading ? '下载中...' : '下载'}
          </button>
          <span class="dl-status" id="dl-status-${safeId}"></span>
        </div>
      `;
    }).join('');

    // 绑定下载按钮
    list.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const versionId = btn.dataset.version;
        await this.downloadVersion(versionId);
      });
    });
  },

  async downloadVersion(versionId) {
    if (this.downloading.has(versionId)) {
      alert('该版本正在下载中...');
      return;
    }

    this.downloading.set(versionId, true);
    const safeId = versionId.replace(/[^a-zA-Z0-9]/g, '_');
    const btnEl = document.querySelector(`[data-version="${versionId}"] .dl-btn`);
    const statusEl = document.getElementById(`dl-status-${safeId}`);

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '下载中...';
    }

    if (statusEl) {
      statusEl.textContent = '准备下载...';
      statusEl.className = 'dl-status';
    }

    try {
      const result = await window.electronAPI.downloadGame(versionId);

      if (result.success) {
        if (statusEl) {
          statusEl.textContent = '✅ 完成';
          statusEl.classList.add('success');
        }
        if (btnEl) {
          btnEl.textContent = '已安装';
        }
        await this.refreshInstalled();
        window.electronAPI.notify({
          title: '下载完成',
          body: `版本 ${versionId} 已成功安装`
        });
      } else {
        if (statusEl) {
          statusEl.textContent = '❌ ' + result.error;
          statusEl.classList.add('error');
        }
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = '重试';
        }
      }
    } catch (error) {
      console.error('下载失败:', error);
      if (statusEl) {
        statusEl.textContent = '❌ 失败';
        statusEl.classList.add('error');
      }
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '重试';
      }
    } finally {
      this.downloading.delete(versionId);
    }
  }
};
