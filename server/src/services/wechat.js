const https = require('https')

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

async function code2Session(code) {
  const appId = process.env.WX_APP_ID
  const secret = process.env.WX_APP_SECRET
  if (!appId || !secret) {
    return {
      openid: 'dev_' + Buffer.from(String(code || 'guest')).toString('base64').slice(0, 16),
      devMode: true
    }
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
  const data = await httpsGet(url)
  if (data.errcode) {
    const err = new Error(data.errmsg || '微信登录失败')
    err.code = data.errcode
    throw err
  }
  return { openid: data.openid, sessionKey: data.session_key, devMode: false }
}

module.exports = { code2Session }
