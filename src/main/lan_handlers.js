
const { ipcMain, BrowserWindow } = require('electron');
const os = require('os');
const dgram = require('dgram');

// 23. 获取网络接口信息
ipcMain.handle('get-network-interfaces', async () => {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      result.push({
        name,
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal
      });
    }
  }

  return result;
});

// 24. 扫描局域网（UDP 广播）
ipcMain.handle('scan-lan', async (event, data) => {
  const socket = dgram.createSocket('udp4');

  return new Promise((resolve) => {
    socket.bind(() => {
      socket.setBroadcast(true);

      const message = Buffer.from(JSON.stringify(data));
      socket.send(message, 0, message.length, 4445, '255.255.255.255', (err) => {
        if (err) console.error('广播失败:', err);
      });

      setTimeout(() => {
        socket.close();
        resolve({ success: true });
      }, 1000);
    });
  });
});

// 25. 广播局域网消息
ipcMain.handle('broadcast-lan', async (event, data) => {
  const socket = dgram.createSocket('udp4');

  return new Promise((resolve) => {
    socket.bind(() => {
      socket.setBroadcast(true);

      const message = Buffer.from(JSON.stringify(data));
      socket.send(message, 0, message.length, 4445, '255.255.255.255', (err) => {
        if (err) console.error('广播失败:', err);
        socket.close();
        resolve({ success: true });
      });
    });
  });
});

// 26. Wiki 查询
ipcMain.handle('query-wiki', async (event, query) => {
  try {
    const axios = require('axios');
    
    // 搜索 Minecraft Wiki
    const searchUrl = `https://minecraft.wiki/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'MagicianPCL/1.2.0'
      }
    });

    if (response.data && response.data.extract) {
      return {
        success: true,
        answer: response.data.extract,
        url: response.data.content_urls?.desktop?.page
      };
    } else {
      // 尝试搜索相关页面
      const searchApiUrl = `https://minecraft.wiki/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
      const searchResponse = await axios.get(searchApiUrl, { timeout: 5000 });

      if (searchResponse.data && searchResponse.data[1] && searchResponse.data[1].length > 0) {
        const pageTitle = searchResponse.data[1][0];
        const pageUrl = searchResponse.data[3] ? searchResponse.data[3][0] : null;

        if (pageUrl) {
          const summaryResponse = await axios.get(
            `https://minecraft.wiki/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
            { timeout: 5000 }
          );

          return {
            success: true,
            answer: summaryResponse.data.extract || '找到相关页面，但无法获取摘要。',
            url: pageUrl
          };
        }
      }

      return {
        success: false,
        answer: '未找到相关信息'
      };
    }
  } catch (error) {
    console.error('Wiki 查询失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// ============ UDP 监听器（局域网发现）============
function startLANListener() {
  const socket = dgram.createSocket('udp4');

  socket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());

      // 只处理 MagicianPCL 消息
      if (data.type && data.type.startsWith('MAGICIAN_PCL_')) {
        const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
        if (mainWindow) {
          mainWindow.webContents.send('lan-broadcast', {
            ...data,
            ip: rinfo.address,
            port: rinfo.port
          });
        }
      }
    } catch (e) {
      // 忽略非 JSON 消息
    }
  });

  socket.bind(4445, () => {
    console.log('局域网监听器已启动，端口 4445');
  });
}

startLANListener();
