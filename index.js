var _ = require('slapdash')
var defaults = require('./defaults')
var getRecommendations = require('./get')

module.exports = function recommendations (options, overrides) {
  if (!options) {
    throw new Error('No `options` object passed')
  }

  var config = _.assign({}, defaults, {
    trackingId: options.meta.trackingId,
    visitorId: options.meta.visitorId,
    experienceId: options.meta.experienceId,
    iterationId: options.meta.iterationId,
    variationId: options.meta.variationId
  }, overrides)

  function coerceToNumber (n) {
    if (typeof n === 'number') {
      return n
    }
    if (typeof n === 'string' && n.length > 0) {
      n = n
        .replace(/[^0-9,.]/g, '')
        .replace(/,(?=\d{1,2}$)/, '.')
        .replace(/(\s|,)/g, '')
        .replace(/\.(?=[0-9]{3}(\.|,))/g, '')

      if (n === '') return
      if (!isNaN(Number(n))) return Number(n)
    }
  }

  return {
    get: getRecommendations(config, { uv: options.uv }),
    shown: function (item) {
      item = _.pick(item, ['id', 'weight', 'strategy'])
      item.weight = coerceToNumber(item.weight)

      options.uv.emit('qubit.recommendationItemShown', item)
      options.emitMetric('recommendation.shown', item.id, item)
    },
    clicked: function (item) {
      item = _.pick(item, ['id', 'weight', 'strategy', 'position'])
      item.weight = coerceToNumber(item.weight)

      options.uv.emit('qubit.recommendationItemClick', item)
      options.emitMetric('recommendation.clicked', item.id, item)
    }
  }
}
