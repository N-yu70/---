const express = require('express')
const db = require('../db')
const calorie = require('../services/calorie')
const { formatDate } = require('../utils/date')
const { ok } = require('../middleware/response')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
router.use(authRequired)

function buildAndSave(openId, date) {
  const user = db.getUser(openId)
  const records = db.listRecords(openId, date)
  const total = records.reduce((s, r) => s + (r.calories || 0), 0)
  const target = user.profile.dailyCalorieTarget || 1800
  const content = calorie.buildAdvice(total, target, user.profile)
  return db.saveAdvice(openId, content, date)
}

router.get('/latest', (req, res) => {
  const date = req.query.date || formatDate(new Date())
  let item = db.getLatestAdvice(req.openId)
  if (!item || item.adviceDate !== date) {
    item = buildAndSave(req.openId, date)
  }
  ok(res, item)
})

router.post('/generate', (req, res) => {
  const date = (req.body && req.body.date) || formatDate(new Date())
  const item = buildAndSave(req.openId, date)
  ok(res, item)
})

module.exports = router
