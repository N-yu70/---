const RECORDS_KEY = 'diet_records'
const PROFILE_KEY = 'user_profile'

const MEAL_LABELS = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

const defaultProfile = {
  height: '',
  weight: '',
  age: '20',
  gender: 'male',
  activityLevel: 'light',
  preferences: '',
  dailyCalorieTarget: 1800
}

function genId() {
  return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function getRecords() {
  return wx.getStorageSync(RECORDS_KEY) || []
}

function saveRecords(list) {
  wx.setStorageSync(RECORDS_KEY, list)
}

function getRecordsByDate(date) {
  return getRecords().filter(r => r.date === date)
}

function addRecord(record) {
  const list = getRecords()
  const item = {
    id: genId(),
    date: record.date,
    mealType: record.mealType,
    foodName: record.foodName,
    amount: record.amount,
    unit: record.unit,
    calories: record.calories,
    source: record.source || 'manual',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  list.unshift(item)
  saveRecords(list)
  return item
}

function updateRecord(id, patch) {
  const list = getRecords()
  const idx = list.findIndex(r => r.id === id)
  if (idx < 0) return null
  list[idx] = Object.assign({}, list[idx], patch, { updatedAt: Date.now() })
  saveRecords(list)
  return list[idx]
}

function deleteRecord(id) {
  const list = getRecords().filter(r => r.id !== id)
  saveRecords(list)
}

function getRecordById(id) {
  return getRecords().find(r => r.id === id) || null
}

function getDailySummary(date) {
  const records = getRecordsByDate(date)
  const meals = {
    breakfast: { label: '早餐', items: [], calories: 0 },
    lunch: { label: '午餐', items: [], calories: 0 },
    dinner: { label: '晚餐', items: [], calories: 0 },
    snack: { label: '加餐', items: [], calories: 0 }
  }
  let total = 0
  records.forEach(r => {
    const m = meals[r.mealType] || meals.snack
    m.items.push(r)
    m.calories += r.calories || 0
    total += r.calories || 0
  })
  return { records, meals, total }
}

function getWeekStats(baseDate) {
  const { getWeekDates } = require('./date')
  const week = getWeekDates(baseDate)
  const all = getRecords()
  return week.map(w => {
    const dayRecords = all.filter(r => r.date === w.date)
    const calories = dayRecords.reduce((s, r) => s + (r.calories || 0), 0)
    return { date: w.date, label: w.label, calories }
  })
}

function getProfile() {
  const p = wx.getStorageSync(PROFILE_KEY)
  return Object.assign({}, defaultProfile, p || {})
}

function saveProfile(profile) {
  wx.setStorageSync(PROFILE_KEY, profile)
}

module.exports = {
  MEAL_LABELS,
  defaultProfile,
  getRecords,
  getRecordsByDate,
  addRecord,
  updateRecord,
  deleteRecord,
  getRecordById,
  getDailySummary,
  getWeekStats,
  getProfile,
  saveProfile
}
