const { today, guessMealType } = require('../../utils/date')
const data = require('../../utils/data')
const calorie = require('../../utils/calorie')

const UNITS = ['份', '碗', '个', 'g']
const QUICK_AMOUNTS = ['0.5', '1', '1.5', '2', '100', '200']

Page({
  data: {
    isEdit: false,
    id: '',
    mealType: 'lunch',
    foodName: '',
    amount: '1',
    unit: '份',
    unitIndex: 0,
    units: UNITS,
    previewCal: 0,
    quickAmounts: QUICK_AMOUNTS,
    saving: false
  },

  async onLoad(options) {
    const mealType = options.mealType || guessMealType()
    try {
      await getApp().ensureLogin()
      if (options.id) {
        const record = await data.getRecord(options.id)
        const unitIndex = UNITS.indexOf(record.unit)
        wx.setNavigationBarTitle({ title: '编辑记录' })
        this.setData({
          isEdit: true,
          id: record.id,
          mealType: record.mealType,
          foodName: record.foodName,
          amount: String(record.amount),
          unit: record.unit,
          unitIndex: unitIndex >= 0 ? unitIndex : 0,
          previewCal: record.calories || 0
        })
        return
      }
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
    this.setData({ mealType })
    this.updatePreview()
  },

  onMealChange(e) {
    this.setData({ mealType: e.detail.mealType })
  },

  onFoodInput(e) {
    this.setData({ foodName: e.detail.value })
    this.updatePreview()
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
    this.updatePreview()
  },

  onUnitChange(e) {
    const idx = parseInt(e.detail.value, 10)
    this.setData({ unitIndex: idx, unit: UNITS[idx] })
    this.updatePreview()
  },

  setQuickAmount(e) {
    this.setData({ amount: e.currentTarget.dataset.val })
    this.updatePreview()
  },

  updatePreview() {
    clearTimeout(this._previewTimer)
    this._previewTimer = setTimeout(() => this._fetchPreview(), 280)
  },

  async _fetchPreview() {
    const { foodName, amount, unit } = this.data
    const name = (foodName || '').trim()
    const amt = parseFloat(amount)
    if (!name || !amt || amt <= 0) {
      this.setData({ previewCal: 0 })
      return
    }
    try {
      const res = await data.estimateCalorie(name, amt, unit)
      this.setData({ previewCal: res.calories })
    } catch (e) {
      this.setData({
        previewCal: calorie.estimateCalories(name, amt, unit)
      })
    }
  },

  async save() {
    const { isEdit, id, mealType, foodName, amount, unit, previewCal, saving } = this.data
    if (saving) return
    const name = (foodName || '').trim()
    const amt = parseFloat(amount)

    if (!name) {
      wx.showToast({ title: '请输入食物名称', icon: 'none' })
      return
    }
    if (!amt || amt <= 0) {
      wx.showToast({ title: '请输入有效食用量', icon: 'none' })
      return
    }

    const payload = {
      date: today(),
      mealType,
      foodName: name,
      amount: amt,
      unit,
      calories: previewCal,
      source: 'manual'
    }

    this.setData({ saving: true })
    try {
      await getApp().ensureLogin()
      if (isEdit) {
        await data.updateRecord(id, payload)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await data.createRecord(payload)
        wx.showToast({ title: '已保存', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 400)
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
