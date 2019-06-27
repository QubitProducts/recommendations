/* global test expect describe beforeEach afterEach jest */
const uv = require('uv-api')()
const recommendations = require('../index.js')
const httpMock = require('@qubit/qubit-api')

jest.mock('../getLocale')
const getLocale = require('../getLocale')

const getOptions = (overrides = {}) => {
  return {
    emitMetric: () => uv.emit('qubit.metric'),
    uv: { emit: uv.emit, on: uv.on },
    meta: {
      trackingId: 'menards',
      visitorId: '123adwqddqdw',
      experienceId: overrides.experienceId || 123456,
      iterationId: 600100,
      variationId: 165767
    }
  }
}

const rec = {
  data: {
    property: {
      visitor: {
        productRecommendations: [
          {
            weight: 202.5,
            strategy: 'trending_ols_views_1',
            product: {
              product_id: '730699',
              additionalFields: {
                gender: 'women'
              }
            }
          }
        ]
      }
    }
  }
}

const query = `
query ($trackingId: String!, $contextId: String!, $experienceId: Int, $items: Int!, $strategy: [RecommendationStrategyInput!], $seed: [RecommendationSeedInput!], $rules: [RecommendationRuleInput!], $locale: String) {
  property(trackingId: $trackingId, locale: $locale) {
    visitor(contextId: $contextId) {
      productRecommendations(experienceId: $experienceId, items: $items, strategy: $strategy, seed: $seed, customRules: $rules) {
        strategy
        weight
        product {
          product_id: productId
          currency
          sku_code: skuCode
          name
          description
          url
          categories {
            name
          }
          images {
            url
          }
          stock
          language
          locale
          views
          views_ip: viewsIp
          unit_sale_price: unitSalePrice
          unit_price: unitPrice
          additionalFields
        }
      }
    }
  }
}
`

afterEach(() => {
  httpMock.query.mockClear()
  getLocale.mockClear()
})

test('throws error if options is not present', () => {
  expect(() => recommendations()).toThrow()
})

describe('testing basic', () => {
  let language = 'en-GB'
  let currency = 'GBP'
  beforeEach(() => {
    httpMock.__setRecs(rec)
    getLocale.mockImplementation(options => {
      return Promise.resolve(
        [
          language || options.defaultLanguage,
          currency || options.defaultCurrency
        ]
          .join('-')
          .toLowerCase()
      )
    })
  })

  test('requested query is correct', async () => {
    uv.emit('ecView', { language, currency })
    await recommendations(getOptions()).get()
    const calledQuery = httpMock.query.mock.calls[0][0]
    expect(calledQuery).toBe(query)
  })

  test('second instanciation should be independant', async () => {
    uv.emit('ecView', { language, currency })

    const optionsA = getOptions()
    const recsA = recommendations(optionsA)

    const optionsB = getOptions({ experienceId: 4567 })
    const recsB = recommendations(optionsB)

    await recsA.get()
    const calledVariablesA = httpMock.query.mock.calls[0][1]
    expect(calledVariablesA.experienceId).toBe(123456)

    httpMock.__setRecs(rec)
    await recsB.get()
    const calledVariablesB = httpMock.query.mock.calls[1][1]
    expect(calledVariablesB.experienceId).toBe(4567)
  })

  test('data passed is correct', async () => {
    uv.emit('ecView', { language, currency })
    await recommendations(getOptions()).get()
    const apiQuery = httpMock.query.mock.calls[0][0]
    const variables = httpMock.query.mock.calls[0][1]
    expect(apiQuery).toBe(query)
    expect(variables).toStrictEqual({
      trackingId: 'menards',
      contextId: '123adwqddqdw',
      experienceId: 123456,
      items: 10,
      strategy: [{ name: 'pop' }],
      seed: null,
      locale: 'en-gb-gbp',
      rules: undefined
    })
  })

  test('called with the correct timeout', async () => {
    uv.emit('ecView', { language, currency })
    const EXPECTED_TIMEOUT = 1000
    await recommendations(getOptions()).get({ timeout: EXPECTED_TIMEOUT })
    const config = httpMock.query.mock.calls[0][2]
    expect(config).toEqual({
      timeout: EXPECTED_TIMEOUT,
      url: 'https://api.qubit.com/graphql'
    })
  })

  test('should call getLocale with current options', async () => {
    uv.emit('ecView', { language, currency })
    const options = getOptions()
    await recommendations(options).get()
    expect(getLocale.mock.calls[0][0].uv).toEqual(options.uv)
  })

  test('getLocale uses view event when no overrides present', async () => {
    const options = getOptions()
    uv.emit('ecView', { language, currency })
    const locale = await getLocale({ uv: options.uv })
    expect(locale).toEqual('en-gb-gbp')
  })

  test('getLocale uses defaults when view event values not present', async () => {
    const options = getOptions()
    language = null
    currency = null
    uv.emit('ecView', { language, currency })
    const locale = await getLocale({
      uv: options.uv,
      defaultCurrency: 'USD',
      defaultLanguage: 'en-US'
    })
    expect(locale).toEqual('en-us-usd')
  })

  test('locale defaults to config values when present', async () => {
    const options = getOptions()
    uv.emit('ecView', { language: null, currency: null })
    const config = {
      defaultLanguage: 'en-us',
      defaultCurrency: 'USD'
    }
    const recommendations = require('../index.js')(options, config)
    await recommendations.get()
    expect(getLocale.mock.calls[0][0].defaultLanguage).toEqual(
      config.defaultLanguage
    )
    expect(getLocale.mock.calls[0][0].defaultCurrency).toEqual(
      config.defaultCurrency
    )
  })

  test('locale defaults to request settings when present', async () => {
    const options = getOptions()
    uv.emit('ecView', { language, currency: null })
    const fallbackCurrency = 'USD'
    await recommendations(options).get({ defaultCurrency: fallbackCurrency })
    expect(getLocale.mock.calls[0][0].defaultCurrency).toEqual(fallbackCurrency)
  })

  test('responds with recs for basic setup', async () => {
    const options = getOptions()
    uv.emit('ecView', { language, currency })

    const recs = await recommendations(options).get()
    expect(recs).toBeInstanceOf(Array)
    expect(recs[0].weight).toEqual(202.5)
    expect(recs[0].strategy).toEqual('trending_ols_views_1')
    expect(recs[0].id).toEqual('730699')
    expect(recs[0].details.product_id).toEqual('730699')
    expect(recs[0].details.gender).toEqual('women')
  })
})

describe('test metric events', () => {
  beforeEach(() => {
    uv.events.length = 0
  })

  test('clicked event emits 2 qp events', () => {
    const options = getOptions()
    recommendations(options).clicked(rec)
    expect(uv.events).toHaveLength(2)
    expect(uv.events[0].meta.type).toEqual('qubit.recommendationItemClick')
  })

  test('shown event emits 2 qp events', () => {
    const options = getOptions()
    recommendations(options).shown(rec)
    expect(uv.events).toHaveLength(2)
  })
})
