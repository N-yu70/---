Component({
  properties: {
    intake: { type: Number, value: 0 },
    target: { type: Number, value: 1800 },
    statusColor: { type: String, value: '#4CAF50' }
  },
  data: {
    percent: 0
  },
  observers: {
    'intake, target': function (intake, target) {
      const t = target || 1800
      const p = Math.min(Math.round((intake / t) * 100), 150)
      this.setData({ percent: p })
    }
  }
})
