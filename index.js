var _ = require('slapdash')
var defaults = require('./defaults')
var getRecommendations = require('./get')

module.exports = function recommendations (options, overrides) {
  if (!options) {
    throw new Error('No `options` object passed')
  }

  var config = _.assign(defaults, {
    trackingId: options.meta.trackingId,
    visitorId: options.meta.visitorId,
    experienceId: options.meta.experienceId,
    iterationId: options.meta.iterationId,
    variationId: options.meta.variationId
  }, overrides)

  return {
    get: getRecommendations(config),
    shown: function (item) {
      item = _.pick(item, ['id', 'weight', 'strategy'])
      options.uv.emit('qubit.recommendationItemShown', item)
      options.emitMetric('recommendation.shown', item.id, item)
    },
    clicked: function (item) {
      item = _.pick(item, ['id', 'weight', 'strategy', 'position'])
      options.uv.emit('qubit.recommendationItemClicked', item)
      options.emitMetric('recommendation.clicked', item.id, item)
    }
  }
}
