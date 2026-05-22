/**
 * 统一数据层：优先云端 API，连不上时自动回退本地存储
 */
const api = require('./api')
const storage = require('./storage')
const calorie = require('./calorie')
const { ping } = require('./request')
const { getWeekDates } = require('./date')

const OFFLINE_KEY = 'offline_mode'

function isOffline() {
  return !!wx.getStorageSync(OFFLINE_KEY)
}

function setOffline(v) {
  if (v) wx.setStorageSync(OFFLINE_KEY, '1')
  else wx.removeStorageSync(OFFLINE_KEY)
  const app = getApp()
  if (app) app.globalData.offline = !!v
}

async function checkOnline() {
  if (isOffline()) return false
  try {
    await ping()
    setOffline(false)
    return true
  } catch (e) {
    setOffline(true)
    return false
  }
}

function wrap(localFn, apiFn) {
  return async function (...args) {
    const online = await checkOnline()
    if (!online) return localFn(...args)
    try {
      return await apiFn(...args)
    } catch (e) {
      const msg = (e && e.message) || ''
      if (msg.includes('无法连接') || msg.includes('request:fail') || msg.includes('网络')) {
        setOffline(true)
        return localFn(...args)
      }
      throw e
    }
  }
}

// --- 记录 ---
const getRecords = wrap(
  (date, mealType) => {
    let list = storage.getRecordsByDate(date)
    if (mealType) list = list.filter(r => r.mealType === mealType)
    return list
  },
  api.getRecords
)

const getRecord = wrap(storage.getRecordById, api.getRecord)

const getSummary = wrap(
  (date) => {
    const s = storage.getDailySummary(date)
    return { date, meals: s.meals, total: s.total, records: s.records }
  },
  api.getSummary
)

const createRecord = wrap(storage.addRecord, api.createRecord)

const updateRecord = wrap(
  (id, payload) => storage.updateRecord(id, payload),
  api.updateRecord
)

const deleteRecord = wrap(
  (id) => { storage.deleteRecord(id); return { id } },
  api.deleteRecord
)

const clearRecords = wrap(
  () => {
    wx.removeStorageSync('diet_records')
    return { deleted: 0 }
  },
  api.clearRecords
)

// --- 用户 ---
const getProfile = wrap(storage.getProfile, api.getProfile)

const saveProfile = wrap(storage.saveProfile, api.saveProfile)

async function recommendTarget() {
  const online = await checkOnline()
  if (!online) {
    const p = storage.getProfile()
    const t = calorie.recommendTarget(p)
    storage.saveProfile(Object.assign({}, p, { dailyCalorieTarget: t }))
    return { dailyCalorieTarget: t, profile: storage.getProfile() }
  }
  try {
    return await api.recommendTarget()
  } catch (e) {
    setOffline(true)
    const p = storage.getProfile()
    const t = calorie.recommendTarget(p)
    return { dailyCalorieTarget: t }
  }
}

async function estimateCalorie(foodName, amount, unit) {
  const online = await checkOnline()
  if (!online) return { calories: calorie.estimateCalories(foodName, amount, unit) }
  try {
    return await api.estimateCalorie(foodName, amount, unit)
  } catch (e) {
    return { calories: calorie.estimateCalories(foodName, amount, unit) }
  }
}

async function getLatestAdvice(date) {
  const online = await checkOnline()
  const profile = storage.getProfile()
  const summary = storage.getDailySummary(date)
  const local = {
    content: calorie.getMockAdvice(summary.total, profile.dailyCalorieTarget || 1800, profile),
    adviceDate: date
  }
  if (!online) return local
  try {
    return await api.getLatestAdvice(date)
  } catch (e) {
    setOffline(true)
    return local
  }
}

async function getStats(type, date) {
  const profile = storage.getProfile()
  const target = profile.dailyCalorieTarget || 1800
  if (type === 'week') {
    const days = storage.getWeekStats(date).map(d => ({
      date: d.date,
      label: d.label,
      calories: d.calories
    }))
    return { type: 'week', date, target, days }
  }
  const summary = storage.getDailySummary(date)
  return {
    type: 'day',
    date,
    target,
    total: summary.total,
    meals: ['breakfast', 'lunch', 'dinner', 'snack'].map(key => ({
      key,
      label: summary.meals[key].label,
      calories: summary.meals[key].calories
    }))
  }
}

async function getStatsApi(type, date) {
  const online = await checkOnline()
  if (!online) return getStats(type, date)
  try {
    return await api.getStats(type, date)
  } catch (e) {
    setOffline(true)
    return getStats(type, date)
  }
}

module.exports = {
  isOffline,
  setOffline,
  checkOnline,
  getRecords,
  getRecord,
  getSummary,
  createRecord,
  updateRecord,
  deleteRecord,
  clearRecords,
  getProfile,
  saveProfile,
  recommendTarget,
  estimateCalorie,
  getLatestAdvice,
  getStats: getStatsApi
}
