var _ = require('slapdash')
var http = require('@qubit/http-api')
var getLocale = require('./getLocale')

module.exports = function getRecommendations (config, options) {
  return function (settings) {
    settings = settings || {}

    var strategy = settings.strategy || config.strategy
    var limit = settings.limit || config.limit
    var seed = settings.seed || config.seed
    var timeout = settings.timeout || config.timeout
    var rules = settings.rules || config.rules
    var url = settings.url || config.url
    var trackingId = settings.trackingId || config.trackingId
    var visitorId = settings.visitorId || config.visitorId

    if (!_.isArray(seed)) {
      seed = [seed]
    }

    // convert { category: 'x' } -> { type: 'c', id: 'x' }
    // hopefully, the API will add support for the former
    // at which point we can remove this mapping
    seed = _.map(seed, function (s) {
      if (_.isObject(s) && s.category) {
        return { type: 'c', id: s.category }
      } else {
        return s
      }
    })

    var data = { h: seed }

    if (rules) {
      _.assign(data, { rules: rules })
    }

    return getLocale({ uv: options.uv }).then(function (locale) {
      var requestUrl = [
        url,
        trackingId,
        '?strategy=' + strategy,
        '&id=' + visitorId,
        '&n=' + limit,
        '&experienceId=' + config.experienceId,
        '&iterationId=' + config.iterationId,
        '&variationId=' + config.variationId,
        '&locale=' + locale
      ].join('')

      var request = http.post(requestUrl, JSON.stringify(data), { timeout: timeout })
      return request.then(function (result) {
        if (result) {
          var recs = JSON.parse(result)
          var items = _.get(recs, 'result.items')

          if (items && items.length) {
            return items
          }
        }

        var error = new Error('No recommendations')
        error.code = 'NO_RECOMMENDATIONS'
        throw error
      })
    })
  }
}
