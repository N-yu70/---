const jwt = require('jsonwebtoken')

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return res.status(401).json({ code: 40101, message: '未登录', data: null })
  }
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-shiguang'
    const payload = jwt.verify(token, secret)
    req.openId = payload.openId
    next()
  } catch (e) {
    return res.status(401).json({ code: 40101, message: '登录已过期', data: null })
  }
}

module.exports = { authRequired }
