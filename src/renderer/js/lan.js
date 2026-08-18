// ===== 局域网联机管理器 =====
const LANManager = {
  players: [],
  isScanning: false,
  isHosting: false,
  socket: null,
  broadcastInterval: null,
  localIP: null,

  async init() {
    await this.getLocalIP();
    this.setupEventListeners();
    this.updatePlayerName();
    this.updateLocalInfo();
  },

  async getLocalIP() {
    // 获取本机 IP
    try {
      const interfaces = await window.electronAPI.getNetworkInterfaces();
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          this.localIP = iface.address;
          document.getElementById('lan-ip').textContent = this.localIP;
          break;
        }
      }
    } catch (e) {
      document.getElementById('lan-ip').textContent = '未知';
    }
  },

  setupEventListeners() {
    // 扫描局域网
    document.getElementById('btn-scan-lan')?.addEventListener('click', () => {
      this.scanLAN();
    });

    // 创建房间
    document.getElementById('btn-host-lan')?.addEventListener('click', () => {
      this.hostGame();
    });

    // 监听其他玩家广播
    window.electronAPI.onLANBroadcast?.((data) => {
      this.handleBroadcast(data);
    });
  },

  updatePlayerName() {
    const playerName = document.getElementById('launch-username')?.value || 'Player';
    document.getElementById('lan-player-name').textContent = playerName;
  },

  updateLocalInfo() {
    document.getElementById('lan-state').textContent = this.isHosting ? '已创建房间' : '离线';
  },

  async scanLAN() {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    this.players = [];
    document.getElementById('lan-status').textContent = '扫描中...';
    document.getElementById('btn-scan-lan').disabled = true;

    // 清空列表
    const playersList = document.getElementById('lan-players');
    playersList.innerHTML = `
      <div class="scanning-indicator">
        <div class="spinner"></div>
        <p>正在扫描局域网...</p>
      </div>
    `;

    // 发送 UDP 广播
    await window.electronAPI.scanLAN({
      type: 'MAGICIAN_PCL_DISCOVER',
      timestamp: Date.now()
    });

    // 等待 5 秒收集响应
    setTimeout(() => {
      this.isScanning = false;
      document.getElementById('lan-status').textContent = `发现 ${this.players.length} 位玩家`;
      document.getElementById('btn-scan-lan').disabled = false;
      this.renderPlayers();
    }, 5000);
  },

  handleBroadcast(data) {
    // 过滤自己的广播
    if (data.ip === this.localIP) {
      return;
    }

    // 检查是否已存在
    const existing = this.players.find(p => p.ip === data.ip);
    if (!existing) {
      this.players.push({
        playerName: data.playerName,
        version: data.version,
        ip: data.ip,
        port: data.port,
        timestamp: data.timestamp
      });
      this.renderPlayers();
      window.electronAPI.notify({
        title: '发现局域网玩家',
        body: `${data.playerName} (${data.ip}) 已加入局域网`
      });
    }
  },

  renderPlayers() {
    const playersList = document.getElementById('lan-players');
    
    if (this.players.length === 0) {
      playersList.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <p>未发现局域网玩家</p>
          <p class="hint">确保对方已运行 MagicianPCL 并开启局域网发现</p>
        </div>
      `;
      return;
    }

    playersList.innerHTML = this.players.map((player, index) => `
      <div class="player-card" style="animation-delay: ${index * 0.1}s">
        <div class="player-avatar">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="player-info">
          <div class="player-name">${player.playerName}</div>
          <div class="player-meta">
            <span>${player.version || '未知版本'}</span>
            <span>${player.ip}:${player.port || 25565}</span>
          </div>
        </div>
        <div class="player-actions">
          <button class="btn-join" onclick="LANManager.joinGame('${player.ip}', ${player.port || 25565})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            加入游戏
          </button>
        </div>
      </div>
    `).join('');
  },

  async hostGame() {
    if (this.isHosting) {
      alert('你已经创建了房间');
      return;
    }

    this.isHosting = true;
    const playerName = document.getElementById('launch-username')?.value || 'Player';
    const version = Launcher.currentVersion || 'Unknown';

    // 开始广播
    this.broadcastInterval = setInterval(() => {
      window.electronAPI.broadcastLAN({
        type: 'MAGICIAN_PCL_ANNOUNCE',
        playerName: playerName,
        version: version,
        ip: this.localIP,
        port: 25565,
        timestamp: Date.now()
      });
    }, 2000); // 每 2 秒广播一次

    document.getElementById('lan-state').textContent = '已创建房间';
    document.getElementById('btn-host-lan').textContent = '关闭房间';
    document.getElementById('btn-host-lan').onclick = () => this.stopHosting();

    alert(`房间已创建！\n其他玩家可以在局域网中找到你`);
  },

  stopHosting() {
    this.isHosting = false;
    
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    document.getElementById('lan-state').textContent = '离线';
    document.getElementById('btn-host-lan').textContent = '创建房间';
    document.getElementById('btn-host-lan').onclick = () => this.hostGame();
  },

  async joinGame(ip, port) {
    // 复制服务器地址到剪贴板
    const serverAddress = `${ip}:${port}`;
    
    try {
      await navigator.clipboard.writeText(serverAddress);
      alert(`服务器地址已复制: ${serverAddress}\n\n请启动 Minecraft 后:\n1. 点击"多人游戏"\n2. 点击"添加服务器"\n3. 粘贴地址并加入`);
    } catch (e) {
      alert(`服务器地址: ${serverAddress}\n\n请启动 Minecraft 后手动输入`);
    }
  }
};
