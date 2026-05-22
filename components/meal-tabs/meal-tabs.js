Component({
  properties: {
    active: {
      type: String,
      value: 'breakfast'
    }
  },
  data: {
    tabs: [
      { key: 'breakfast', label: '早餐' },
      { key: 'lunch', label: '午餐' },
      { key: 'dinner', label: '晚餐' },
      { key: 'snack', label: '加餐' }
    ]
  },
  methods: {
    onTap(e) {
      const key = e.currentTarget.dataset.key
      this.triggerEvent('change', { mealType: key })
    }
  }
})
