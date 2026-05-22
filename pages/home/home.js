const { today } = require('../../utils/date')
const data = require('../../utils/data')
const calorie = require('../../utils/calorie')

Page({
  data: {
    date: '',
    intake: 0,
    target: 1800,
    status: {},
    advice: '',
    mealList: [],
    loading: true,
    offline: false
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    const date = today()
    this.setData({ loading: true })
    try {
      await getApp().ensureLogin()
      const [summary, profile, adviceRes] = await Promise.all([
        data.getSummary(date),
        data.getProfile(),
        data.getLatestAdvice(date)
      ])
      const target = profile.dailyCalorieTarget || 1800
      const status = calorie.getStatus(summary.total, target)
      const order = ['breakfast', 'lunch', 'dinner', 'snack']
      const mealList = order.map(key => {
        const m = summary.meals[key]
        return {
          key,
          label: m.label,
          calories: m.calories,
          count: m.items.length,
          items: m.items.slice(0, 3)
        }
      })
      this.setData({
        date,
        intake: summary.total,
        target,
        status,
        advice: adviceRes.content || '',
        mealList,
        loading: false,
        offline: data.isOffline()
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  addRecord() {
    wx.navigateTo({ url: '/pages/record-edit/record-edit' })
  }
})
