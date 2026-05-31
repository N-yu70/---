const auth = require('./utils/auth')
const data = require('./utils/data')

App({
  onLaunch() {
    this.globalData.offline = data.isOffline()
    this.globalData.loginReady = auth.ensureLogin().then(() => {
      this.globalData.offline = data.isOffline()
    }).catch((e) => {
      console.error('login', e)
      data.setOffline(true)
      this.globalData.offline = true
    })
  },

  ensureLogin() {
    return auth.ensureLogin()
  },

  globalData: {
    version: 'P1',
    loginReady: null,
    offline: false
  }
})
