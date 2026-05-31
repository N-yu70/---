/**
 * API 地址
 * - 模拟器：自动使用 127.0.0.1（不要用局域网 IP）
 * - 真机：使用下方 LAN_IP（ipconfig 查看本机 IPv4）
 */
const PORT = 3000
// 真机调试时改成你电脑的局域网 IP
const LAN_IP = '10.36.95.18'

function getBaseUrl() {
  let host = LAN_IP
  try {
    const sys = wx.getSystemInfoSync()
    // 开发者工具模拟器走本机回环地址更稳定
    if (sys.platform === 'devtools') {
      host = '127.0.0.1'
    }
  } catch (e) {
    host = '127.0.0.1'
  }
  return `http://${host}:${PORT}/api`
}

module.exports = {
  PORT,
  LAN_IP,
  getBaseUrl
}
