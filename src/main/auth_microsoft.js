// ===== Microsoft 正版账号登录 (Device Code Flow) =====
// 流程: device code -> MS token -> Xbox Live -> XSTS -> Minecraft token -> profile
// client_id 默认可用社区公开值；用户可在设置页填自定义 Azure 应用 ID

const axios = require('axios');

const MS_CLIENT_ID = '00000000402b5328';
const TENANT = 'consumers';
const SCOPE = 'XboxLive.signin offline_access';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MagicianPCL';

function msFormPost(url, body) {
  return axios.post(url, new URLSearchParams(body).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    timeout: 20000,
  }).then(r => r.data).catch(e => {
    if (e.response && e.response.data) return e.response.data;
    throw e;
  });
}

function msJsonPost(url, body) {
  return axios.post(url, body, {
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    timeout: 20000,
  }).then(r => r.data);
}

// 1. 请求 device code，返回 {user_code, verification_uri, device_code, interval, expires_in}
async function startDeviceCode(clientId = MS_CLIENT_ID) {
  return msFormPost(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/devicecode`,
    { client_id: clientId, scope: SCOPE }
  );
}

// 2. 用 device_code 轮询 MS token，返回 {access_token,...} 或 {error:'authorization_pending'} 等
async function pollDeviceToken(clientId, deviceCode) {
  return msFormPost(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    { grant_type: 'urn:ietf:params:oauth:grant-type:device_code', client_id: clientId, device_code: deviceCode }
  );
}

// 用 refresh_token 换取新的 MC access token（启动游戏时自动刷新）
async function refreshAccessToken(clientId, refreshToken) {
  return msFormPost(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    { grant_type: 'refresh_token', client_id: clientId, refresh_token: refreshToken }
  );
}

// 3+4. MS token -> Xbox Live -> XSTS -> Minecraft token
async function xboxAuthenticate(msToken) {
  const xbl = await msJsonPost('https://user.auth.xboxlive.com/user/authenticate', {
    Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msToken}` },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType: 'JWT',
  });
  const xsts = await msJsonPost('https://xsts.auth.xboxlive.com/xsts/authorize', {
    Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.Token] },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT',
  });
  const uhs = xbl.DisplayClaims.xui[0].uhs;
  const mc = await msJsonPost('https://api.minecraftservices.com/authentication/login_with_xbox', {
    identityToken: `XBL3.0 x=${uhs}; ${xsts.Token}`,
  });
  return mc.access_token;
}

// 5. 获取 MC profile（含 uuid + 用户名），404 表示未拥有游戏
async function getMcProfile(mcToken) {
  try {
    return await axios.get('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: `Bearer ${mcToken}`, 'User-Agent': UA },
      timeout: 20000,
    }).then(r => r.data);
  } catch (e) {
    if (e.response && e.response.status === 404) {
      const err = new Error('该 Microsoft 账号未拥有 Minecraft Java 版');
      err.needPurchase = true;
      throw err;
    }
    throw e;
  }
}

// 完整：MS token -> MC 账号信息
async function completeLogin(msToken) {
  const mcToken = await xboxAuthenticate(msToken);
  const profile = await getMcProfile(mcToken);
  return { mcToken, uuid: profile.id, name: profile.name };
}

module.exports = {
  MS_CLIENT_ID,
  startDeviceCode,
  pollDeviceToken,
  refreshAccessToken,
  xboxAuthenticate,
  getMcProfile,
  completeLogin,
};
