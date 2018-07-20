var _ = require('slapdash')
var http = require('@qubit/http-api')

module.exports = function getRecommendations (config) {
  return function (settings) {
    settings = settings || {}

    var strategy = settings.strategy || config.strategy
    var limit = settings.limit || config.limit
    var seed = settings.seed || config.seed
    var timeout = settings.timeout || config.timeout
    var rules = settings.rules

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

    var url = [
      config.url,
      config.trackingId,
      '?strategy=' + strategy,
      '&id=' + config.visitorId,
      '&n=' + limit,
      '&experienceId=' + config.experienceId,
      '&iterationId=' + config.iterationId,
      '&variationId=' + config.variationId
    ].join('')

    return http.post(url, JSON.stringify(data), { timeout: timeout }).then(function (result) {
      if (result) {
        var recs = JSON.parse(result)

        if (recs && recs.result && recs.result.items && recs.result.items.length) {
          return recs.result.items
        }
      }

      var error = new Error('No recommendations')
      error.code = 'NO_RECOMMENDATIONS'
      throw error
    })
  }
}
