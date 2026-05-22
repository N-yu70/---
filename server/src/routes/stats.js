const express = require('express')
const db = require('../db')
const { getWeekDates } = require('../utils/date')
const { ok, fail } = require('../middleware/response')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
router.use(authRequired)

router.get('/', (req, res) => {
  const { type, date } = req.query
  if (!date) return fail(res, 40001, '缺少 date')
  const user = db.getUser(req.openId)
  const target = user.profile.dailyCalorieTarget || 1800

  if (type === 'week') {
    const week = getWeekDates(date)
    const all = db.listRecords(req.openId)
    const days = week.map(w => {
      const calories = all
        .filter(r => r.date === w.date)
        .reduce((s, r) => s + (r.calories || 0), 0)
      return { date: w.date, label: w.label, calories }
    })
    return ok(res, { type: 'week', date, target, days })
  }

  const records = db.listRecords(req.openId, date)
  const meals = {
    breakfast: { label: '早餐', calories: 0 },
    lunch: { label: '午餐', calories: 0 },
    dinner: { label: '晚餐', calories: 0 },
    snack: { label: '加餐', calories: 0 }
  }
  let total = 0
  records.forEach(r => {
    const key = meals[r.mealType] ? r.mealType : 'snack'
    meals[key].calories += r.calories || 0
    total += r.calories || 0
  })
  ok(res, {
    type: 'day',
    date,
    target,
    total,
    meals: Object.keys(meals).map(k => ({
      key: k,
      label: meals[k].label,
      calories: meals[k].calories
    }))
  })
})

module.exports = router
