var _ = require('slapdash')
var qubitApi = require('@qubit/qubit-api')
var getLocale = require('./getLocale')

var query = [
  'query ($trackingId: String!, $contextId: String!, $experienceId: Int, $items: Int!, $strategy: [RecommendationStrategyInput!], $seed: [RecommendationSeedInput!], $rules: [RecommendationRuleInput!], $locale: String) {',
  '  property(trackingId: $trackingId, locale: $locale) {',
  '    visitor(contextId: $contextId) {',
  '      productRecommendations(experienceId: $experienceId, items: $items, strategy: $strategy, seed: $seed, customRules: $rules) {',
  '        strategy',
  '        weight',
  '        product {',
  '          product_id: productId',
  '          currency',
  '          sku_code: skuCode',
  '          name',
  '          description',
  '          url',
  '          categories {',
  '            name',
  '          }',
  '          images {',
  '            url',
  '          }',
  '          stock',
  '          language',
  '          locale',
  '          views',
  '          views_ip: viewsIp',
  '          unit_sale_price: unitSalePrice',
  '          unit_price: unitPrice',
  '          additionalFields',
  '        }',
  '      }',
  '    }',
  '  }',
  '}'
].join('\n')

module.exports = function getRecommendations (config, options) {
  return function (settings) {
    settings = settings || {}

    var strategy = settings.strategy || config.strategy
    var limit = settings.limit || config.limit
    var seed = settings.seed || config.seed
    var rules = settings.rules || config.rules
    var trackingId = settings.trackingId || config.trackingId
    var visitorId = settings.visitorId || config.visitorId
    var defaultCurrency = settings.defaultCurrency || config.defaultCurrency
    var defaultLanguage = settings.defaultLanguage || config.defaultLanguage

    if (seed !== 'all') {
      if (!_.isArray(seed)) {
        seed = [seed]
      }

      // convert { category: 'x' } -> { type: 'c', id: 'x' }
      // hopefully, the API will add support for the former
      // at which point we can remove this mapping
      seed = _.map(seed, function (s) {
        if (_.isObject(s) && s.category) {
          return { type: 'CATEGORY', value: s.category }
        } else {
          return { type: 'PRODUCT', value: s }
        }
      })
    } else {
      seed = null
    }

    return getLocale({
      uv: options.uv,
      defaultCurrency: defaultCurrency,
      defaultLanguage: defaultLanguage
    }).then(function (locale) {
      var variables = {
        trackingId: trackingId,
        contextId: visitorId,
        experienceId: config.experienceId,
        items: limit,
        strategy: [{ name: strategy }],
        seed: seed,
        rules: rules,
        locale: locale
      }

      return qubitApi.query(query, variables).then(function (result) {
        if (result) {
          var items = _.get(
            result,
            'data.property.visitor.productRecommendations'
          )
          if (items && items.length) {
            // Convert back to native Recs API format to support legacy experiences
            items = _.map(items, function (item) {
              item.id = item.product.product_id
              item.details = item.product
              if (item.product.images) {
                item.product.images = _.pluck(item.product.images, 'url')
              }
              if (item.product.categories) {
                item.product.categories = _.pluck(item.product.categories, 'name')
              }
              if (item.product.additionalFields) {
                _.objectEach(item.product.additionalFields, function (v, k) {
                  item.details[k] = v
                })
              }
              delete item.details.additionalFields
              delete item.product
              return item
            })
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
