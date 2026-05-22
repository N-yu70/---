const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
function uuidv4() {
  return crypto.randomUUID()
}

const DATA_DIR = path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const defaultDb = () => ({
  users: {},
  records: [],
  advices: []
})

let cache = null

function load() {
  if (cache) return cache
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      return cache
    }
  } catch (e) {
    console.error('db load error', e)
  }
  cache = defaultDb()
  save()
  return cache
}

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), 'utf8')
}

function getUser(openId) {
  const db = load()
  if (!db.users[openId]) {
    db.users[openId] = {
      openId,
      profile: {
        height: '',
        weight: '',
        age: '20',
        gender: 'male',
        activityLevel: 'light',
        preferences: '',
        dailyCalorieTarget: 1800
      },
      createdAt: Date.now()
    }
    save()
  }
  return db.users[openId]
}

function updateUserProfile(openId, profile) {
  const user = getUser(openId)
  user.profile = Object.assign({}, user.profile, profile)
  save()
  return user.profile
}

function listRecords(openId, date, mealType) {
  const db = load()
  let list = db.records.filter(r => r.userId === openId)
  if (date) list = list.filter(r => r.date === date)
  if (mealType) list = list.filter(r => r.mealType === mealType)
  return list.sort((a, b) => b.createdAt - a.createdAt)
}

function getRecord(openId, id) {
  const db = load()
  const r = db.records.find(x => x.id === id && x.userId === openId)
  return r || null
}

function createRecord(openId, data) {
  const db = load()
  const item = {
    id: uuidv4(),
    userId: openId,
    date: data.date,
    mealType: data.mealType,
    foodName: data.foodName,
    amount: data.amount,
    unit: data.unit,
    calories: data.calories,
    source: data.source || 'manual',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  db.records.unshift(item)
  save()
  return item
}

function updateRecord(openId, id, patch) {
  const db = load()
  const idx = db.records.findIndex(r => r.id === id && r.userId === openId)
  if (idx < 0) return null
  db.records[idx] = Object.assign({}, db.records[idx], patch, { updatedAt: Date.now() })
  save()
  return db.records[idx]
}

function deleteRecord(openId, id) {
  const db = load()
  const before = db.records.length
  db.records = db.records.filter(r => !(r.id === id && r.userId === openId))
  save()
  return before !== db.records.length
}

function clearRecords(openId) {
  const db = load()
  const before = db.records.length
  db.records = db.records.filter(r => r.userId !== openId)
  save()
  return before - db.records.length
}

function saveAdvice(openId, content, adviceDate) {
  const db = load()
  const item = {
    id: uuidv4(),
    userId: openId,
    content,
    adviceDate,
    createdAt: Date.now()
  }
  db.advices.unshift(item)
  if (db.advices.length > 200) db.advices = db.advices.slice(0, 200)
  save()
  return item
}

function getLatestAdvice(openId) {
  const db = load()
  return db.advices.find(a => a.userId === openId) || null
}

module.exports = {
  getUser,
  updateUserProfile,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  clearRecords,
  saveAdvice,
  getLatestAdvice
}
