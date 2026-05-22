const data = require('../../utils/data')
const calorie = require('../../utils/calorie')

const GENDERS = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' }
]
const ACTIVITIES = [
  { key: 'low', label: '久坐' },
  { key: 'light', label: '轻度活动' },
  { key: 'medium', label: '中度运动' },
  { key: 'high', label: '高强度' }
]

Page({
  data: {
    profile: {},
    genderIndex: 0,
    activityIndex: 1,
    genders: GENDERS,
    activities: ACTIVITIES,
    openId: '',
    devHint: ''
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      await getApp().ensureLogin()
      const profile = await data.getProfile()
      const openId = wx.getStorageSync('openId') || ''
      const genderIndex = GENDERS.findIndex(g => g.key === profile.gender)
      const activityIndex = ACTIVITIES.findIndex(a => a.key === profile.activityLevel)
      this.setData({
        profile,
        openId: openId.slice(0, 12) + (openId.length > 12 ? '…' : ''),
        devHint: data.isOffline() ? '离线模式（数据仅存本机）' : (openId.startsWith('dev_') ? '开发模式登录' : ''),
        genderIndex: genderIndex >= 0 ? genderIndex : 0,
        activityIndex: activityIndex >= 0 ? activityIndex : 1
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`profile.${field}`]: e.detail.value })
  },

  onGenderChange(e) {
    const idx = parseInt(e.detail.value, 10)
    this.setData({
      genderIndex: idx,
      'profile.gender': GENDERS[idx].key
    })
  },

  onActivityChange(e) {
    const idx = parseInt(e.detail.value, 10)
    this.setData({
      activityIndex: idx,
      'profile.activityLevel': ACTIVITIES[idx].key
    })
  },

  async recommendTarget() {
    try {
      await getApp().ensureLogin()
      const res = await data.recommendTarget()
      this.setData({ 'profile.dailyCalorieTarget': res.dailyCalorieTarget })
      wx.showToast({ title: `推荐 ${res.dailyCalorieTarget} 千卡`, icon: 'none' })
    } catch (e) {
      const target = calorie.recommendTarget(this.data.profile)
      this.setData({ 'profile.dailyCalorieTarget': target })
      wx.showToast({ title: `本地推荐 ${target} 千卡`, icon: 'none' })
    }
  },

  async save() {
    const profile = Object.assign({}, this.data.profile)
    profile.dailyCalorieTarget = parseInt(profile.dailyCalorieTarget, 10) || 1800
    try {
      await getApp().ensureLogin()
      await data.saveProfile(profile)
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    }
  },

  clearData() {
    const that = this
    wx.showModal({
      title: '清空数据',
      content: '将删除云端所有饮食记录，是否继续？',
      confirmColor: '#f44336',
      success(res) {
        if (res.confirm) that._doClear()
      }
    })
  },

  async _doClear() {
    try {
      await getApp().ensureLogin()
      await data.clearRecords()
      wx.showToast({ title: '已清空', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.message || '清空失败', icon: 'none' })
    }
  }
})
