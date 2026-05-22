function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getWeekDates(baseDate) {
  const d = new Date(String(baseDate).replace(/-/g, '/'))
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const dates = []
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    dates.push({ date: formatDate(cur), label: labels[i] })
  }
  return dates
}

module.exports = { formatDate, getWeekDates }
