/* global test expect describe beforeEach afterEach jest */
const uv = require('uv-api')()
const recommendations = require('../index.js')
const httpMock = require('@qubit/http-api')

jest.mock('../getLocale')
const getLocale = require('../getLocale')

const options = {
  emitMetric: () => uv.emit('qubit.metric'),
  uv: { emit: uv.emit, on: uv.on },
  meta: {
    trackingId: 'menards',
    visitorId: '123adwqddqdw',
    experienceId: 123456,
    iterationId: 600100,
    variationId: 165767
  }
}

const rec = {
  weight: 202.5,
  strategy: 'trending_ols_views_1',
  product: {
    productId: '730699'
  }
}

afterEach(() => {
  httpMock.post.mockClear()
  getLocale.mockClear()
})

test('throws error if options is not present', () => {
  expect(() => recommendations()).toThrow()
})

describe('testing basic', () => {
  let language = 'en-GB'
  let currency = 'GBP'
  beforeEach(() => {
    httpMock.__setRecs({
      data: { property: { visitor: { productRecommendations: [rec] } } }
    })
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

  test('requested url is correct', async () => {
    uv.emit('ecView', { language, currency })
    await recommendations(options).get()
    const calledUrl = httpMock.post.mock.calls[0][0]
    expect(calledUrl).toBe('https://api.qubit.com/graphql')
  })

  test('data passed is correct', async () => {
    uv.emit('ecView', { language, currency })
    await recommendations(options).get()
    const data = httpMock.post.mock.calls[0][1]
    expect(data).toBe(
      JSON.stringify({
        query:
          'query ($trackingId: String!, $contextId: String!, $experienceId: Int, $items: Int!, $strategy: [RecommendationStrategyInput!], $seed: [RecommendationSeedInput!], $rules: [RecommendationRuleInput!], $locale: String) {\n  property(trackingId: $trackingId, locale: $locale) {\n    visitor(contextId: $contextId) {\n      productRecommendations(experienceId: $experienceId, items: $items, strategy: $strategy, seed: $seed, customRules: $rules) {\n        strategy\n        weight\n        product {\n          product_id: productId\n          currency\n          sku_code: skuCode\n          name\n          description\n          url\n          categories {\n            name\n          }\n          images {\n            url\n          }\n          stock\n          language\n          locale\n          views\n          views_ip: viewsIp\n          unit_sale_price: unitSalePrice\n          unit_price: unitPrice\n          additionalFields\n        }\n      }\n    }\n  }\n}',
        variables: {
          trackingId: 'menards',
          contextId: '123adwqddqdw',
          experienceId: 123456,
          items: 10,
          strategy: [{ name: 'pop' }],
          seed: null,
          locale: 'en-gb-gbp'
        }
      })
    )
  })

  test('called with the correct timeout', async () => {
    uv.emit('ecView', { language, currency })
    const EXPECTED_TIMEOUT = 1000
    await recommendations(options).get({ timeout: EXPECTED_TIMEOUT })
    const config = httpMock.post.mock.calls[0][2]
    expect(config).toEqual({ timeout: EXPECTED_TIMEOUT })
  })

  test('should call getLocale with current options', async () => {
    uv.emit('ecView', { language, currency })
    await recommendations(options).get()
    expect(getLocale.mock.calls[0][0].uv).toEqual(options.uv)
  })

  test('getLocale uses view event when no overrides present', async () => {
    uv.emit('ecView', { language, currency })
    const locale = await getLocale({ uv: options.uv })
    expect(locale).toEqual('en-gb-gbp')
  })

  test('getLocale uses defaults when view event values not present', async () => {
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
    uv.emit('ecView', { language, currency: null })
    const fallbackCurrency = 'USD'
    await recommendations(options).get({ defaultCurrency: fallbackCurrency })
    expect(getLocale.mock.calls[0][0].defaultCurrency).toEqual(fallbackCurrency)
  })

  test('responds with recs for basic setup', async () => {
    uv.emit('ecView', { language, currency })
    expect.assertions(1)

    const recs = await recommendations(options).get()
    expect(recs).toBeInstanceOf(Array)
  })
})

describe('test metric events', () => {
  beforeEach(() => {
    uv.events.length = 0
  })

  test('clicked event emits 2 qp events', () => {
    recommendations(options).clicked(rec)
    expect(uv.events).toHaveLength(2)
    expect(uv.events[0].meta.type).toEqual('qubit.recommendationItemClick')
  })

  test('shown event emits 2 qp events', () => {
    recommendations(options).shown(rec)
    expect(uv.events).toHaveLength(2)
  })
})
