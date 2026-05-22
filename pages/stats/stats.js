const { today } = require('../../utils/date')
const data = require('../../utils/data')

const DAY_COLORS = ['#81C784', '#4CAF50', '#388E3C', '#A5D6A7']

Page({
  data: {
    viewType: 'day',
    date: '',
    target: 1800,
    chartBars: [],
    dayMeals: [],
    dayTotal: 0,
    weekData: [],
    loading: false
  },

  onShow() {
    this.setData({ date: today() })
    this.refresh()
  },

  switchView(e) {
    const viewType = e.currentTarget.dataset.type
    this.setData({ viewType }, () => this.refresh())
  },

  async refresh() {
    const { viewType, date } = this.data
    this.setData({ loading: true })
    try {
      await getApp().ensureLogin()
      if (viewType === 'day') {
        await this.loadDay(date)
      } else {
        await this.loadWeek(date)
      }
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadDay(date) {
    const res = await data.getStats('day', date)
    const target = res.target || 1800
    const max = Math.max(target, res.total, 1)
    const dayMeals = (res.meals || []).map((m, i) => ({
      key: m.key,
      label: m.label,
      calories: m.calories,
      color: DAY_COLORS[i] || '#4CAF50',
      barPercent: max > 0
        ? Math.max(Math.round((m.calories / max) * 100), m.calories > 0 ? 8 : 0)
        : 0,
      percent: max > 0 ? Math.round((m.calories / max) * 100) : 0
    }))
    const chartBars = dayMeals.map(m => ({
      key: m.key,
      label: m.label,
      calories: m.calories,
      color: m.color,
      barPercent: m.barPercent
    }))
    this.setData({
      target,
      dayMeals,
      dayTotal: res.total || 0,
      chartBars,
      weekData: []
    })
  },

  async loadWeek(date) {
    const res = await data.getStats('week', date)
    const target = res.target || 1800
    const maxVal = Math.max(
      target,
      ...(res.days || []).map(d => d.calories),
      1
    )
    const todayStr = today()
    const weekData = (res.days || []).map(d => ({
      date: d.date,
      label: d.label,
      calories: d.calories,
      isToday: d.date === todayStr,
      barPercent: maxVal > 0
        ? Math.max(Math.round((d.calories / maxVal) * 100), d.calories > 0 ? 8 : 0)
        : 0,
      percent: maxVal > 0 ? Math.round((d.calories / maxVal) * 100) : 0,
      color: d.date === todayStr ? '#4CAF50' : '#A5D6A7'
    }))
    const chartBars = weekData.map(d => ({
      key: d.date,
      label: d.label,
      calories: d.calories,
      color: d.color,
      barPercent: d.barPercent
    }))
    const todayItem = weekData.find(d => d.date === date)
    this.setData({
      target,
      weekData,
      dayTotal: todayItem ? todayItem.calories : 0,
      chartBars,
      dayMeals: []
    })
  }
})
