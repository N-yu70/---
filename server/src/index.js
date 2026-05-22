/**
 * 零依赖 HTTP 服务（仅需 Node.js，无需 npm install）
 * 启动: node src/index.js
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { URL } = require('url')

const db = require('./db')
const calorie = require('./services/calorie')
const { code2Session } = require('./services/wechat')
const { formatDate, getWeekDates } = require('./utils/date')

// 加载 .env
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  })
}

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-shiguang'

function ok(res, data) {
  send(res, 200, { code: 0, message: 'ok', data })
}

function fail(res, code, message, status) {
  send(res, status || 400, { code, message, data: null })
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  })
  res.end(JSON.stringify(body))
}

function signToken(openId) {
  const exp = Date.now() + 30 * 24 * 3600 * 1000
  const payload = JSON.stringify({ openId, exp })
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
  return Buffer.from(payload, 'utf8').toString('base64url') + '.' + sig
}

function verifyToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  try {
    const payload = Buffer.from(parts[0], 'base64url').toString('utf8')
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
    if (sig !== parts[1]) return null
    const data = JSON.parse(payload)
    if (data.exp < Date.now()) return null
    return data.openId
  } catch (e) {
    return null
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

function getAuthOpenId(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  return verifyToken(token)
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    })
    return res.end()
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/$/, '') || '/'

  try {
    // GET /api/health
    if (req.method === 'GET' && pathname === '/api/health') {
      return ok(res, { service: '食光智语 API', version: 'P1', deps: 'zero' })
    }

    // POST /api/auth/login
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(req)
      if (!body.code) return fail(res, 40001, '缺少 code')
      const session = await code2Session(body.code)
      db.getUser(session.openid)
      return ok(res, {
        token: signToken(session.openid),
        openId: session.openid,
        devMode: !!session.devMode
      })
    }

    const openId = getAuthOpenId(req)
    if (!openId && pathname.startsWith('/api/') && pathname !== '/api/health') {
      return fail(res, 40101, '未登录', 401)
    }

    // GET /api/records/summary
    if (req.method === 'GET' && pathname === '/api/records/summary') {
      const date = url.searchParams.get('date')
      if (!date) return fail(res, 40001, '缺少 date')
      const records = db.listRecords(openId, date)
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
      return ok(res, { date, meals, total, records })
    }

    // GET /api/records
    if (req.method === 'GET' && pathname === '/api/records') {
      const date = url.searchParams.get('date')
      const mealType = url.searchParams.get('mealType')
      if (!date) return fail(res, 40001, '缺少 date')
      return ok(res, db.listRecords(openId, date, mealType || null))
    }

    // GET /api/records/:id
    const recordGet = pathname.match(/^\/api\/records\/([^/]+)$/)
    if (req.method === 'GET' && recordGet && recordGet[1] !== 'summary') {
      const record = db.getRecord(openId, recordGet[1])
      if (!record) return fail(res, 40004, '记录不存在', 404)
      return ok(res, record)
    }

    // POST /api/records
    if (req.method === 'POST' && pathname === '/api/records') {
      const body = await readBody(req)
      const { date, mealType, foodName, amount, unit, source } = body
      if (!date || !mealType || !foodName || amount == null || !unit) {
        return fail(res, 40001, '参数不完整')
      }
      const calories = body.calories != null
        ? body.calories
        : calorie.estimateCalories(foodName, amount, unit)
      return ok(res, db.createRecord(openId, {
        date, mealType, foodName, amount, unit, calories, source
      }))
    }

    // PUT /api/records/:id
    const recordPut = pathname.match(/^\/api\/records\/([^/]+)$/)
    if (req.method === 'PUT' && recordPut) {
      const body = await readBody(req)
      const existing = db.getRecord(openId, recordPut[1])
      if (!existing) return fail(res, 40004, '记录不存在', 404)
      const patch = {}
      ;['date', 'mealType', 'foodName', 'amount', 'unit', 'source'].forEach(k => {
        if (body[k] !== undefined) patch[k] = body[k]
      })
      const merged = Object.assign({}, existing, patch)
      patch.calories = body.calories != null
        ? body.calories
        : calorie.estimateCalories(merged.foodName, merged.amount, merged.unit)
      return ok(res, db.updateRecord(openId, recordPut[1], patch))
    }

    // DELETE /api/records/all
    if (req.method === 'DELETE' && pathname === '/api/records/all') {
      return ok(res, { deleted: db.clearRecords(openId) })
    }

    // DELETE /api/records/:id
    const recordDel = pathname.match(/^\/api\/records\/([^/]+)$/)
    if (req.method === 'DELETE' && recordDel && recordDel[1] !== 'all') {
      if (!db.deleteRecord(openId, recordDel[1])) return fail(res, 40004, '记录不存在', 404)
      return ok(res, { id: recordDel[1] })
    }

    // GET /api/user/profile
    if (req.method === 'GET' && pathname === '/api/user/profile') {
      return ok(res, db.getUser(openId).profile)
    }

    // PUT /api/user/profile
    if (req.method === 'PUT' && pathname === '/api/user/profile') {
      const body = await readBody(req)
      return ok(res, db.updateUserProfile(openId, body))
    }

    // POST /api/user/target/recommend
    if (req.method === 'POST' && pathname === '/api/user/target/recommend') {
      const user = db.getUser(openId)
      const target = calorie.recommendTarget(user.profile)
      const profile = db.updateUserProfile(openId, { dailyCalorieTarget: target })
      return ok(res, { dailyCalorieTarget: target, profile })
    }

    // POST /api/calorie/estimate
    if (req.method === 'POST' && pathname === '/api/calorie/estimate') {
      const body = await readBody(req)
      const { foodName, amount, unit } = body
      if (!foodName || amount == null || !unit) return fail(res, 40001, '参数不完整')
      return ok(res, { calories: calorie.estimateCalories(foodName, amount, unit) })
    }

    // GET /api/stats
    if (req.method === 'GET' && pathname === '/api/stats') {
      const type = url.searchParams.get('type')
      const date = url.searchParams.get('date')
      if (!date) return fail(res, 40001, '缺少 date')
      const target = db.getUser(openId).profile.dailyCalorieTarget || 1800
      if (type === 'week') {
        const week = getWeekDates(date)
        const all = db.listRecords(openId)
        const days = week.map(w => ({
          date: w.date,
          label: w.label,
          calories: all.filter(r => r.date === w.date).reduce((s, r) => s + (r.calories || 0), 0)
        }))
        return ok(res, { type: 'week', date, target, days })
      }
      const records = db.listRecords(openId, date)
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
      return ok(res, {
        type: 'day', date, target, total,
        meals: Object.keys(meals).map(k => ({ key: k, label: meals[k].label, calories: meals[k].calories }))
      })
    }

    // GET /api/advice/latest
    if (req.method === 'GET' && pathname === '/api/advice/latest') {
      const date = url.searchParams.get('date') || formatDate(new Date())
      let item = db.getLatestAdvice(openId)
      if (!item || item.adviceDate !== date) {
        const user = db.getUser(openId)
        const records = db.listRecords(openId, date)
        const total = records.reduce((s, r) => s + (r.calories || 0), 0)
        const content = calorie.buildAdvice(total, user.profile.dailyCalorieTarget || 1800, user.profile)
        item = db.saveAdvice(openId, content, date)
      }
      return ok(res, item)
    }

    fail(res, 40400, '接口不存在', 404)
  } catch (e) {
    console.error(e)
    fail(res, 50000, e.message || '服务器错误', 500)
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(e => {
    console.error(e)
    fail(res, 50000, '服务器错误', 500)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  const devMode = !(process.env.WX_APP_ID && process.env.WX_APP_SECRET)
  console.log(`食光智语 API http://127.0.0.1:${PORT} （零依赖，无需 npm install）`)
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`)
  console.log(`微信登录: ${devMode ? '开发模式' : '正式模式'}`)
})
