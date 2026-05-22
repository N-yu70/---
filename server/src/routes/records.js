const express = require('express')
const db = require('../db')
const calorie = require('../services/calorie')
const { ok, fail } = require('../middleware/response')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
router.use(authRequired)

const MEAL_LABELS = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

router.get('/', (req, res) => {
  const { date, mealType } = req.query
  if (!date) return fail(res, 40001, '缺少 date')
  const list = db.listRecords(req.openId, date, mealType || null)
  ok(res, list)
})

router.get('/summary', (req, res) => {
  const { date } = req.query
  if (!date) return fail(res, 40001, '缺少 date')
  const records = db.listRecords(req.openId, date)
  const meals = {
    breakfast: { label: '早餐', items: [], calories: 0 },
    lunch: { label: '午餐', items: [], calories: 0 },
    dinner: { label: '晚餐', items: [], calories: 0 },
    snack: { label: '加餐', items: [], calories: 0 }
  }
  let total = 0
  records.forEach(r => {
    const key = meals[r.mealType] ? r.mealType : 'snack'
    meals[key].items.push(r)
    meals[key].calories += r.calories || 0
    total += r.calories || 0
  })
  ok(res, { date, meals, total, records })
})

router.get('/:id', (req, res) => {
  const record = db.getRecord(req.openId, req.params.id)
  if (!record) return fail(res, 40004, '记录不存在', 404)
  ok(res, record)
})

router.post('/', (req, res) => {
  const body = req.body || {}
  const { date, mealType, foodName, amount, unit, source } = body
  if (!date || !mealType || !foodName || !amount || !unit) {
    return fail(res, 40001, '参数不完整')
  }
  let calories = body.calories
  if (calories == null) {
    calories = calorie.estimateCalories(foodName, amount, unit)
  }
  const item = db.createRecord(req.openId, {
    date,
    mealType,
    foodName: String(foodName).trim(),
    amount: parseFloat(amount),
    unit,
    calories,
    source: source || 'manual'
  })
  ok(res, item)
})

router.put('/:id', (req, res) => {
  const body = req.body || {}
  const existing = db.getRecord(req.openId, req.params.id)
  if (!existing) return fail(res, 40004, '记录不存在', 404)

  const patch = {}
  ;['date', 'mealType', 'foodName', 'amount', 'unit', 'source'].forEach(k => {
    if (body[k] !== undefined) patch[k] = body[k]
  })
  if (patch.foodName) patch.foodName = String(patch.foodName).trim()
  if (patch.amount != null) patch.amount = parseFloat(patch.amount)

  const merged = Object.assign({}, existing, patch)
  patch.calories = body.calories != null
    ? body.calories
    : calorie.estimateCalories(merged.foodName, merged.amount, merged.unit)

  const item = db.updateRecord(req.openId, req.params.id, patch)
  ok(res, item)
})

router.delete('/all', (req, res) => {
  const count = db.clearRecords(req.openId)
  ok(res, { deleted: count })
})

router.delete('/:id', (req, res) => {
  const okDel = db.deleteRecord(req.openId, req.params.id)
  if (!okDel) return fail(res, 40004, '记录不存在', 404)
  ok(res, { id: req.params.id })
})

module.exports = router
