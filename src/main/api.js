// Modrinth API 客户端
const axios = require('axios');

const MODRINTH_API = 'https://api.modrinth.com/v2';
const CURSEFORGE_API = 'https://api.curseforge.com/v1';

// Modrinth API
const ModrinthAPI = {
  // 搜索项目（模组/资源包/光影包/整合包）
  async searchProjects(query, options = {}) {
    const {
      limit = 20,
      offset = 0,
      facets = [], // ['project_type:mod', 'categories:fabric']
      index = 'relevance'
    } = options;

    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString(),
        index
      });

      if (facets.length > 0) {
        params.append('facets', JSON.stringify(facets));
      }

      const response = await axios.get(`${MODRINTH_API}/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Modrinth 搜索失败:', error);
      return { hits: [], total_hits: 0 };
    }
  },

  // 获取项目详情
  async getProject(projectId) {
    try {
      const response = await axios.get(`${MODRINTH_API}/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('获取项目失败:', error);
      return null;
    }
  },

  // 获取项目版本列表
  async getVersions(projectId, options = {}) {
    const { gameVersions = [], loaders = [] } = options;
    
    try {
      const params = new URLSearchParams();
      
      if (gameVersions.length > 0) {
        params.append('game_versions', JSON.stringify(gameVersions));
      }
      if (loaders.length > 0) {
        params.append('loaders', JSON.stringify(loaders));
      }

      const response = await axios.get(`${MODRINTH_API}/project/${projectId}/version?${params}`);
      return response.data;
    } catch (error) {
      console.error('获取版本列表失败:', error);
      return [];
    }
  },

  // 获取特定版本
  async getVersion(versionId) {
    try {
      const response = await axios.get(`${MODRINTH_API}/version/${versionId}`);
      return response.data;
    } catch (error) {
      console.error('获取版本失败:', error);
      return null;
    }
  },

  // 通过文件哈希获取版本
  async getVersionFromHash(hash, algorithm = 'sha1') {
    try {
      const response = await axios.get(`${MODRINTH_API}/version_file/${hash}`, {
        params: { algorithm }
      });
      return response.data;
    } catch (error) {
      console.error('获取版本失败:', error);
      return null;
    }
  },

  // 获取多个项目
  async getProjects(projectIds) {
    try {
      const response = await axios.get(`${MODRINTH_API}/projects`, {
        params: { ids: JSON.stringify(projectIds) }
      });
      return response.data;
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return [];
    }
  },

  // 分类列表
  async getCategories() {
    try {
      const response = await axios.get(`${MODRINTH_API}/tag/category`);
      return response.data;
    } catch (error) {
      console.error('获取分类失败:', error);
      return [];
    }
  },

  // 游戏版本列表
  async getGameVersions() {
    try {
      const response = await axios.get(`${MODRINTH_API}/tag/game_version`);
      return response.data;
    } catch (error) {
      console.error('获取游戏版本失败:', error);
      return [];
    }
  },

  // 加载器列表
  async getLoaders() {
    try {
      const response = await axios.get(`${MODRINTH_API}/tag/loader`);
      return response.data;
    } catch (error) {
      console.error('获取加载器失败:', error);
      return [];
    }
  }
};

// Minecraft 官方 API
const MinecraftAPI = {
  // 获取版本清单
  async getVersionManifest() {
    try {
      const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
      return response.data;
    } catch (error) {
      console.error('获取版本清单失败:', error);
      return null;
    }
  },

  // 获取特定版本详情
  async getVersionDetails(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('获取版本详情失败:', error);
      return null;
    }
  }
};

// Forge API
const ForgeAPI = {
  async getForgeVersions(minecraftVersion) {
    try {
      const response = await axios.get(`https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json`);
      return response.data;
    } catch (error) {
      console.error('获取 Forge 版本失败:', error);
      return null;
    }
  }
};

// Fabric API
const FabricAPI = {
  async getFabricVersions() {
    try {
      const response = await axios.get('https://meta.fabricmc.net/v2/versions/game');
      return response.data;
    } catch (error) {
      console.error('获取 Fabric 版本失败:', error);
      return [];
    }
  },

  async getLoaderVersions() {
    try {
      const response = await axios.get('https://meta.fabricmc.net/v2/versions/loader');
      return response.data;
    } catch (error) {
      console.error('获取 Fabric Loader 版本失败:', error);
      return [];
    }
  }
};

module.exports = {
  ModrinthAPI,
  MinecraftAPI,
  ForgeAPI,
  FabricAPI
};
