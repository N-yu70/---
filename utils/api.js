const { request } = require('./request')

const api = {
  getRecords(date, mealType) {
    const data = { date }
    if (mealType) data.mealType = mealType
    return request('/records', 'GET', data)
  },

  getRecord(id) {
    return request('/records/' + id, 'GET')
  },

  getSummary(date) {
    return request('/records/summary', 'GET', { date })
  },

  createRecord(payload) {
    return request('/records', 'POST', payload)
  },

  updateRecord(id, payload) {
    return request('/records/' + id, 'PUT', payload)
  },

  deleteRecord(id) {
    return request('/records/' + id, 'DELETE')
  },

  clearRecords() {
    return request('/records/all', 'DELETE')
  },

  getProfile() {
    return request('/user/profile', 'GET')
  },

  saveProfile(profile) {
    return request('/user/profile', 'PUT', profile)
  },

  recommendTarget() {
    return request('/user/target/recommend', 'POST', {})
  },

  estimateCalorie(foodName, amount, unit) {
    return request('/calorie/estimate', 'POST', { foodName, amount, unit })
  },

  getStats(type, date) {
    return request('/stats', 'GET', { type, date })
  },

  getLatestAdvice(date) {
    return request('/advice/latest', 'GET', { date })
  }
}

module.exports = api
