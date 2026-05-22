const { today, guessMealType } = require('../../utils/date')
const data = require('../../utils/data')

Page({
  data: {
    date: '',
    mealType: 'lunch',
    records: [],
    totalCal: 0,
    loading: false
  },

  onShow() {
    this.setData({
      date: today(),
      mealType: guessMealType()
    })
    this.loadList()
  },

  onMealChange(e) {
    this.setData({ mealType: e.detail.mealType })
    this.loadList()
  },

  async loadList() {
    const { date, mealType } = this.data
    this.setData({ loading: true })
    try {
      await getApp().ensureLogin()
      const records = await data.getRecords(date, mealType)
      const totalCal = records.reduce((s, r) => s + (r.calories || 0), 0)
      this.setData({ records, totalCal, loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  addRecord() {
    const { mealType } = this.data
    wx.navigateTo({
      url: `/pages/record-edit/record-edit?mealType=${mealType}`
    })
  },

  editRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/record-edit/record-edit?id=${id}`
    })
  },

  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条饮食记录吗？',
      success(res) {
        if (res.confirm) that._doDelete(id)
      }
    })
  },

  async _doDelete(id) {
    try {
      await getApp().ensureLogin()
      await data.deleteRecord(id)
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadList()
    } catch (e) {
      wx.showToast({ title: e.message || '删除失败', icon: 'none' })
    }
  },

  onStub(e) {
    const type = e.currentTarget.dataset.type
    const names = { photo: '拍照识别', voice: '语音记录' }
    wx.showToast({
      title: `${names[type]}将在 P2 开放`,
      icon: 'none'
    })
  }
})
