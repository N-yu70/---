function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function today() {
  return formatDate(new Date())
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate.replace(/-/g, '/'))
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const dates = []
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    dates.push({
      date: formatDate(cur),
      label: labels[i]
    })
  }
  return dates
}

function guessMealType() {
  const h = new Date().getHours()
  if (h >= 6 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 17 && h < 21) return 'dinner'
  return 'snack'
}

module.exports = {
  formatDate,
  today,
  getWeekDates,
  guessMealType
}
