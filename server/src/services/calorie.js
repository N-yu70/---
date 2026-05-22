/** 服务端热量估算（与小程序 utils/calorie.js 逻辑一致） */
const FOOD_DB = {
  '米饭': { per100g: 116, perUnit: { 碗: 230, 份: 200 } },
  '面条': { per100g: 138, perUnit: { 碗: 280, 份: 250 } },
  '馒头': { per100g: 221, perUnit: { 个: 110 } },
  '面包': { per100g: 265, perUnit: { 个: 150, 份: 120 } },
  '鸡蛋': { per100g: 144, perUnit: { 个: 72 } },
  '牛奶': { per100g: 54, perUnit: { 份: 130 } },
  '豆浆': { per100g: 31, perUnit: { 碗: 80, 份: 60 } },
  '苹果': { per100g: 53, perUnit: { 个: 80 } },
  '香蕉': { per100g: 89, perUnit: { 个: 105 } },
  '橙子': { per100g: 47, perUnit: { 个: 60 } },
  '鸡肉': { per100g: 167, perUnit: { 份: 200 } },
  '鸡胸肉': { per100g: 133, perUnit: { 份: 180 } },
  '猪肉': { per100g: 143, perUnit: { 份: 220 } },
  '牛肉': { per100g: 125, perUnit: { 份: 250 } },
  '鱼': { per100g: 113, perUnit: { 份: 180 } },
  '豆腐': { per100g: 81, perUnit: { 份: 100 } },
  '蔬菜': { per100g: 25, perUnit: { 份: 50 } },
  '沙拉': { per100g: 45, perUnit: { 份: 120 } },
  '汉堡': { per100g: 295, perUnit: { 个: 450 } },
  '披萨': { per100g: 266, perUnit: { 份: 350 } },
  '薯条': { per100g: 312, perUnit: { 份: 280 } },
  '奶茶': { per100g: 55, perUnit: { 份: 350, 碗: 300 } },
  '咖啡': { per100g: 2, perUnit: { 份: 5 } },
  '酸奶': { per100g: 72, perUnit: { 份: 100 } },
  '坚果': { per100g: 607, perUnit: { 份: 150 } },
  '水饺': { per100g: 198, perUnit: { 个: 40, 份: 400 } },
  '包子': { per100g: 227, perUnit: { 个: 120 } },
  '粥': { per100g: 46, perUnit: { 碗: 150 } },
  '方便面': { per100g: 473, perUnit: { 份: 450 } },
  '炒饭': { per100g: 188, perUnit: { 碗: 450, 份: 400 } },
  '炒面': { per100g: 195, perUnit: { 碗: 480, 份: 420 } },
  '火锅': { per100g: 120, perUnit: { 份: 500 } },
  '麻辣烫': { per100g: 98, perUnit: { 碗: 550 } },
  '寿司': { per100g: 150, perUnit: { 份: 350 } },
  '三明治': { per100g: 250, perUnit: { 个: 320 } },
  '燕麦': { per100g: 367, perUnit: { 碗: 200, 份: 150 } },
  '红薯': { per100g: 86, perUnit: { 个: 150 } },
  '玉米': { per100g: 96, perUnit: { 个: 120 } },
  '土豆': { per100g: 77, perUnit: { 个: 80 } }
}

const DEFAULT_PER_100G = 100
const DEFAULT_PER_UNIT = { 份: 150, 碗: 200, 个: 80, g: 1 }

function findFood(foodName) {
  const name = (foodName || '').trim()
  if (!name) return null
  if (FOOD_DB[name]) return { key: name, data: FOOD_DB[name] }
  for (const key of Object.keys(FOOD_DB)) {
    if (name.includes(key) || key.includes(name)) return { key, data: FOOD_DB[key] }
  }
  return null
}

function estimateCalories(foodName, amount, unit) {
  const amt = parseFloat(amount) || 0
  if (amt <= 0) return 0
  const found = findFood(foodName)
  const u = unit || '份'
  if (found) {
    const { data } = found
    if (data.perUnit && data.perUnit[u]) return Math.round(data.perUnit[u] * amt)
    if (u === 'g' && data.per100g) return Math.round((data.per100g * amt) / 100)
    if (data.per100g) {
      const grams = u === 'g' ? amt : amt * 100
      return Math.round((data.per100g * grams) / 100)
    }
  }
  if (u === 'g') return Math.round((DEFAULT_PER_100G * amt) / 100)
  const per = DEFAULT_PER_UNIT[u] || DEFAULT_PER_UNIT['份']
  return Math.round(per * amt)
}

function recommendTarget(profile) {
  const weight = parseFloat(profile.weight) || 60
  const height = parseFloat(profile.height) || 170
  const age = parseFloat(profile.age) || 20
  const gender = profile.gender || 'male'
  let bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5
  const factors = { low: 1.2, light: 1.375, medium: 1.55, high: 1.725 }
  return Math.round(bmr * (factors[profile.activityLevel] || 1.375))
}

function getStatus(intake, target) {
  if (!target || target <= 0) {
    return { level: 'unknown', text: '请先设置热量目标', color: '#999', hint: '' }
  }
  const ratio = intake / target
  if (ratio < 0.9) {
    return {
      level: 'low',
      text: `还可摄入约 ${Math.round(target - intake)} 千卡`,
      color: '#4CAF50',
      hint: '未达标，可适量加餐'
    }
  }
  if (ratio <= 1.1) {
    return {
      level: 'ok',
      text: '今日摄入较均衡',
      color: '#2196F3',
      hint: '保持现在的节奏'
    }
  }
  return {
    level: 'high',
    text: `已超出约 ${Math.round(intake - target)} 千卡`,
    color: '#FF9800',
    hint: '已超标，注意控制'
  }
}

function buildAdvice(intake, target, profile) {
  const status = getStatus(intake, target)
  const pref = (profile.preferences || '').trim()
  if (status.level === 'low') {
    return `今日摄入偏少。${pref ? '结合你的偏好「' + pref + '」，' : ''}可补充优质蛋白和全谷物。`
  }
  if (status.level === 'high') {
    return `今日热量已偏高，晚餐宜清淡。${pref ? '你的偏好：' + pref + '。' : ''}`
  }
  if (status.level === 'ok') {
    return `摄入较均衡，继续保持！${pref ? '已考虑偏好「' + pref + '」。' : ''}`
  }
  return '在「我的」中填写身高体重，获取每日热量目标。'
}

module.exports = {
  estimateCalories,
  recommendTarget,
  getStatus,
  buildAdvice
}
