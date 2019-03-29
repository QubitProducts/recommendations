const Promise = require('sync-p')

module.exports = function getLocale (options) {
  return new Promise(function (resolve, reject) {
    options.uv.on(/^([^.]+\.)?[a-z]{2}View$/, function (event) {
      var language = options.language || event.language
      var currency = options.currency || event.currency
      var currentLocale = language || currency || ''
      if (language && currency) {
        currentLocale = [language, currency].join('-')
      }
      resolve(currentLocale.toLowerCase())
    }).replay()
  })
}
