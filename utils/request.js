const { getBaseUrl } = require('../config/api')

function normalizeUrl(path) {
  const base = String(getBaseUrl()).replace(/\s+/g, '')
  const p = path.startsWith('/') ? path : '/' + path
  return base + p
}

function request(url, method, data, needAuth = true) {
  const fullUrl = normalizeUrl(url)
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    if (needAuth) {
      const token = wx.getStorageSync('token')
      if (token) header.Authorization = 'Bearer ' + token
    }
    wx.request({
      url: fullUrl,
      method: method || 'GET',
      data: data || {},
      header,
      timeout: 15000,
      success(res) {
        const body = res.data
        if (res.statusCode === 401 || (body && body.code === 40101)) {
          wx.removeStorageSync('token')
          reject(new Error('登录已过期，请重试'))
          return
        }
        if (!body || body.code !== 0) {
          reject(new Error((body && body.message) || '请求失败'))
          return
        }
        resolve(body.data)
      },
      fail(err) {
        const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
        const isDevtools = sys.platform === 'devtools'
        const hint = isDevtools
          ? `模拟器请用 127.0.0.1，并确认已在 server 目录执行 npm run dev`
          : `真机请确认手机与电脑同一 WiFi，LAN_IP=${require('../config/api').LAN_IP}`
        reject(new Error(`无法连接 ${fullUrl}。${hint}`))
        console.error('request fail', fullUrl, err)
      }
    })
  })
}

function ping() {
  return request('/health', 'GET', {}, false)
}

function getRequestBase() {
  return String(getBaseUrl()).replace(/\s+/g, '')
}

module.exports = { request, ping, getRequestBase }
