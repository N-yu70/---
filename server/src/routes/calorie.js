const express = require('express')
const calorie = require('../services/calorie')
const { ok, fail } = require('../middleware/response')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
router.use(authRequired)

router.post('/estimate', (req, res) => {
  const { foodName, amount, unit } = req.body || {}
  if (!foodName || amount == null || !unit) return fail(res, 40001, '参数不完整')
  const calories = calorie.estimateCalories(foodName, amount, unit)
  ok(res, { calories })
})

module.exports = router
