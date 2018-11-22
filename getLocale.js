module.exports = function getLocale () {
  return new Promise((resolve, reject) => {
    window.__qubit.jolt.onEnrichment(/^([^.]+\.)?[a-z]{2}View$/, function (event) {
      var { type, language, currency } = event
      if (/^(basket|checkout|transaction)$/i.test(type)) return
      var currentLocale = language || currency || ''
      if (language && currency) {
        currentLocale = [language, currency].join('-')
      }
      resolve(currentLocale.toLowerCase())
    }).replay()
  })
}
