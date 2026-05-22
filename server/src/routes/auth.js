const express = require('express')
const jwt = require('jsonwebtoken')
const { code2Session } = require('../services/wechat')
const db = require('../db')
const { ok, fail } = require('../middleware/response')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { code } = req.body || {}
  if (!code) return fail(res, 40001, '缺少 code')
  try {
    const session = await code2Session(code)
    db.getUser(session.openid)
    const secret = process.env.JWT_SECRET || 'dev-secret-shiguang'
    const token = jwt.sign(
      { openId: session.openid },
      secret,
      { expiresIn: '30d' }
    )
    ok(res, {
      token,
      openId: session.openid,
      devMode: !!session.devMode
    })
  } catch (e) {
    console.error('login error', e)
    fail(res, 50001, e.message || '登录失败', 500)
  }
})

module.exports = router
