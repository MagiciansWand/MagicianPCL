// 模组管理 - 完整实现
const ModsManager = {
  mods: [],
  filteredMods: [],
  onlineMods: [],
  currentPage: 0,
  currentQuery: '',
  currentFacets: [],
  _initialized: false,
  showingOnline: false,
  
  async init() {
    if (this._initialized) return;
    this._initialized = true;
    
    console.log('ModsManager initializing...');
    await this.loadInstalledMods();
    this.setupEventListeners();
    this.render();
    console.log('ModsManager initialized, mods:', this.mods.length);
  },
  
  // 加载已安装的模组
  async loadInstalledMods() {
    try {
      const mods = await window.electronAPI.scanInstalledMods();
      this.mods = (mods || []).map(mod => ({
        ...mod,
        icon: null,
        version: '未知',
        loader: '未知',
        description: ''
      }));
      this.filteredMods = [...this.mods];
      this.updateStats();
      console.log('Loaded mods:', this.mods.length);
    } catch (error) {
      console.error('加载模组失败:', error);
      this.mods = [];
      this.filteredMods = [];
    }
  },
  
  // 加载在线模组
  async loadOnlineMods(query = '', facets = []) {
    try {
      const result = await window.electronAPI.searchProjects(query, {
        limit: 20,
        offset: this.currentPage * 20,
        facets: ['project_type:mod', ...facets],
        index: 'relevance'
      });
      
      if (result && result.hits) {
        this.onlineMods = result.hits.map(mod => ({
          id: mod.project_id,
          name: mod.title,
          description: mod.description,
          icon: mod.icon_url,
          downloads: mod.downloads,
          follows: mod.follows,
          categories: mod.categories,
          loader: mod.categories?.find(c => ['fabric', 'forge', 'quilt'].includes(c)) || '未知',
          author: mod.author
        }));
      }
      console.log('Loaded online mods:', this.onlineMods.length);
    } catch (error) {
      console.error('加载在线模组失败:', error);
      this.onlineMods = [];
    }
  },
  
  setupEventListeners() {
    // 搜索
    let searchTimeout;
    const searchInput = document.getElementById('mods-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentQuery = e.target.value;
          if (this.showingOnline) {
            this.searchOnline(e.target.value);
          } else {
            this.filter(e.target.value);
          }
        }, 500);
      });
    }
    
    // 版本筛选
    const versionFilter = document.getElementById('mods-version-filter');
    if (versionFilter) {
      versionFilter.addEventListener('change', (e) => {
        this.filterByVersion(e.target.value);
      });
    }
    
    // 加载器筛选
    const loaderFilter = document.getElementById('mods-loader-filter');
    if (loaderFilter) {
      loaderFilter.addEventListener('change', (e) => {
        if (this.showingOnline) {
          this.currentFacets = e.target.value ? [`categories:${e.target.value}`] : [];
          this.loadOnlineMods(this.currentQuery, this.currentFacets).then(() => this.showOnlineMods());
        } else {
          this.filterByLoader(e.target.value);
        }
      });
    }
    
    // 添加模组
    const addBtn = document.getElementById('btn-add-mod');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showOnlineMods();
      });
    }
    
    // 打开模组目录
    const openBtn = document.getElementById('btn-open-mods-folder');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        window.electronAPI.openExternal('file:///C:/Users/Administrator/AppData/Roaming/.minecraft/mods');
      });
    }
  },
  
  async searchOnline(query) {
    this.currentPage = 0;
    await this.loadOnlineMods(query, this.currentFacets);
    this.showOnlineMods();
  },
  
  filter(query) {
    const q = query.toLowerCase();
    this.filteredMods = this.mods.filter(mod => 
      mod.name.toLowerCase().includes(q) ||
      mod.id?.toLowerCase().includes(q)
    );
    this.render();
  },
  
  filterByVersion(versionId) {
    if (!versionId) {
      this.filteredMods = [...this.mods];
    } else {
      this.filteredMods = this.mods.filter(mod => mod.versionId === versionId);
    }
    this.render();
  },
  
  filterByLoader(loader) {
    if (!loader) {
      this.filteredMods = [...this.mods];
    } else {
      this.filteredMods = this.mods.filter(mod => mod.loader === loader);
    }
    this.render();
  },
  
  updateStats() {
    const countEl = document.getElementById('mods-count');
    const updatesEl = document.getElementById('mods-updates');
    const downloadsEl = document.getElementById('mods-downloads');
    
    if (countEl) countEl.textContent = this.mods.length;
    if (updatesEl) updatesEl.textContent = '0';
    if (downloadsEl) downloadsEl.textContent = '0';
  },
  
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },
  
  render() {
    const container = document.getElementById('mods-list');
    if (!container) {
      console.error('mods-list container not found');
      return;
    }
    
    if (this.filteredMods.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p>暂无模组</p>
          <p class="hint">点击"添加模组"按钮搜索并安装模组</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.filteredMods.map((mod, index) => `
      <div class="mod-item" style="animation-delay: ${index * 0.05}s">
        <div class="mod-icon">
          ${mod.icon ? `<img src="${mod.icon}" alt="${mod.name}" onerror="this.style.display='none'" />` : ''}
        </div>
        <div class="mod-info">
          <div class="mod-name">${mod.name}</div>
          <div class="mod-meta">
            <span class="mod-version">v${mod.version || '未知'}</span>
            <span class="mod-loader">${mod.loader || '未知'}</span>
            ${mod.size ? `<span>${this.formatNumber(mod.size)} B</span>` : ''}
          </div>
        </div>
        <div class="mod-actions">
          <button class="btn-icon-small" title="更新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button class="btn-icon-small danger" title="删除" onclick="ModsManager.deleteMod('${mod.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  },
  
  async showOnlineMods() {
    this.showingOnline = true;
    const container = document.getElementById('mods-list');
    if (!container) return;
    
    container.innerHTML = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="color: #6c5ce7; font-size: 16px;">🌐 在线模组库</h3>
        <button class="btn-secondary" onclick="ModsManager.showInstalled()">← 返回已安装</button>
      </div>
      <div style="text-align: center; padding: 40px; color: #888;">
        <p>正在加载模组列表...</p>
      </div>
    `;
    
    await this.loadOnlineMods(this.currentQuery, this.currentFacets);
    
    container.innerHTML = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="color: #6c5ce7; font-size: 16px;">🌐 在线模组库</h3>
        <button class="btn-secondary" onclick="ModsManager.showInstalled()">← 返回已安装</button>
      </div>
      ${this.onlineMods.map((mod, index) => `
        <div class="mod-item" style="animation-delay: ${index * 0.03}s; cursor: pointer;" onclick="ModsManager.showModDetail('${mod.id}')">
          <div class="mod-icon">
            ${mod.icon ? `<img src="${mod.icon}" alt="${mod.name}" onerror="this.style.display='none'" />` : ''}
          </div>
          <div class="mod-info">
            <div class="mod-name">${mod.name}</div>
            <div class="mod-meta">
              <span>${this.formatNumber(mod.downloads || 0)} 下载</span>
              <span class="mod-loader">${mod.loader}</span>
              <span>作者: ${mod.author}</span>
            </div>
          </div>
          <div class="mod-actions">
            <button class="btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="event.stopPropagation(); ModsManager.installMod('${mod.id}')">
              安装
            </button>
          </div>
        </div>
      `).join('')}
      ${this.onlineMods.length === 0 ? `
        <div class="empty-state">
          <p>未找到模组，请尝试其他搜索词</p>
        </div>
      ` : ''}
    `;
  },
  
  showInstalled() {
    this.showingOnline = false;
    this.filteredMods = [...this.mods];
    this.render();
  },
  
  async showModDetail(projectId) {
    try {
      const project = await window.electronAPI.getProject(projectId);
      const versions = await window.electronAPI.getProjectVersions(projectId);
      
      console.log('模组详情:', project);
      console.log('可用版本:', versions);
      
      if (versions && versions.length > 0) {
        this.installMod(projectId, versions[0].id);
      }
    } catch (error) {
      console.error('获取模组详情失败:', error);
    }
  },
  
  async installMod(projectId, versionId = null) {
    try {
      let version = null;
      
      if (versionId) {
        version = await window.electronAPI.getVersion(versionId);
      } else {
        const versions = await window.electronAPI.getProjectVersions(projectId);
        if (versions && versions.length > 0) {
          version = versions[0];
        }
      }
      
      if (!version || !version.files) {
        alert('无法获取模组文件');
        return;
      }
      
      const file = version.files.find(f => f.primary) || version.files[0];
      if (!file) {
        alert('未找到模组文件');
        return;
      }
      
      const result = await window.electronAPI.downloadMod(file.url, file.filename, 'mods');
      
      if (result.success) {
        window.electronAPI.notify({
          title: '模组安装完成',
          body: `✅ ${version.name || file.filename} 已安装到 mods 文件夹`
        });
        await this.loadInstalledMods();
        this.render();
      } else {
        alert('❌ 安装失败: ' + result.error);
      }
    } catch (error) {
      console.error('安装模组失败:', error);
      alert('❌ 安装失败: ' + error.message);
    }
  },
  
  async updateMod(modId) {
    alert('检查更新功能开发中...');
  },
  
  async deleteMod(modId) {
    if (confirm('确定要删除此模组吗？')) {
      try {
        const mod = this.mods.find(m => m.id === modId);
        if (mod && mod.path) {
          // 需要在主进程实现删除功能
          alert('删除功能需要主进程支持');
        }
      } catch (error) {
        console.error('删除模组失败:', error);
        alert('删除失败: ' + error.message);
      }
    }
  }
};
