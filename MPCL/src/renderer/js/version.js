// ===== 版本管理器 =====
const VersionManager = {
  installedVersions: [],

  init() {
    this.refreshInstalled();
    setInterval(() => this.refreshInstalled(), 30000);

    document.getElementById('btn-refresh-versions')?.addEventListener('click', () => {
      this.refreshInstalled();
    });
  },

  async refreshInstalled() {
    try {
      const versions = await window.electronAPI.getInstalledVersions();
      this.installedVersions = versions;
      this.updateSelectOptions();
      this.renderGrid();
      document.getElementById('versions-count').textContent = `已安装: ${versions.length}`;
    } catch (e) {
      console.warn('刷新版本失败:', e);
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

  renderGrid() {
    const grid = document.getElementById('versions-grid');
    if (!grid) return;

    if (this.installedVersions.length === 0) {
      grid.innerHTML = '<div style="color:#888;padding:20px;text-align:center;grid-column:1/-1;">暂无已安装版本，请前往下载中心安装</div>';
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
};
