const Promise = require('sync-p')

module.exports = function getLocale (options) {
  return new Promise(function (resolve, reject) {
    options.uv.on(/^([^.]+\.)?[a-z]{2}View$/, function (event) {
      var language = event.language || options.defaultLanguage
      var currency = event.currency || options.defaultCurrency
      var currentLocale = language || currency || ''
      if (language && currency) {
        currentLocale = [language, currency].join('-')
      }
      resolve(currentLocale.toLowerCase())
    }).replay()
  })
}
