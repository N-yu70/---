const express = require('express')
const db = require('../db')
const calorie = require('../services/calorie')
const { ok } = require('../middleware/response')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
router.use(authRequired)

router.get('/profile', (req, res) => {
  const user = db.getUser(req.openId)
  ok(res, user.profile)
})

router.put('/profile', (req, res) => {
  const body = req.body || {}
  const profile = db.updateUserProfile(req.openId, body)
  ok(res, profile)
})

router.post('/target/recommend', (req, res) => {
  const user = db.getUser(req.openId)
  const target = calorie.recommendTarget(user.profile)
  const profile = db.updateUserProfile(req.openId, { dailyCalorieTarget: target })
  ok(res, { dailyCalorieTarget: target, profile })
})

module.exports = router
