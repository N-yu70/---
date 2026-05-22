const { request, ping, getRequestBase } = require('./request')
const data = require('./data')

let loginPromise = null

function doLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error('wx.login 失败'))
          return
        }
        try {
          await ping()
          data.setOffline(false)
          const body = await request('/auth/login', 'POST', { code: res.code }, false)
          wx.setStorageSync('token', body.token)
          wx.setStorageSync('openId', body.openId)
          if (body.devMode) console.log('[食光智语] 开发模式', body.openId)
          resolve(body.token)
        } catch (e) {
          data.setOffline(true)
          wx.setStorageSync('openId', 'local_offline')
          console.warn('[食光智语] 云端不可用，已切换离线模式', e.message)
          resolve('offline')
        }
      },
      fail: () => reject(new Error('wx.login 调用失败'))
    })
  })
}

function ensureLogin() {
  if (data.isOffline()) return Promise.resolve('offline')
  const token = wx.getStorageSync('token')
  if (token) return Promise.resolve(token)
  if (!loginPromise) {
    loginPromise = doLogin().finally(() => { loginPromise = null })
  }
  return loginPromise
}

function logout() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('openId')
  data.setOffline(false)
}

function getLoginHint() {
  const base = getRequestBase()
  try {
    const sys = wx.getSystemInfoSync()
    if (sys.platform === 'devtools') {
      return `请求地址：${base}\n\n① 双击运行 server\\start.bat\n② 浏览器打开 ${base}/health 应有 JSON\n③ 详情→本地设置→不校验合法域名\n\n若暂无法启动后端，应用会自动使用离线本地存储。`
    }
    return `请求地址：${base}\n\n① 电脑运行 server\\start.bat\n② 手机与电脑同一 WiFi\n③ 修改 config/api.js 的 LAN_IP`
  } catch (e) {
    return '请运行 server\\start.bat 启动后端'
  }
}

module.exports = { ensureLogin, doLogin, logout, getLoginHint }
