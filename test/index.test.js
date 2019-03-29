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
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop',
  position: 1
}

afterEach(() => {
  httpMock.post.mockClear()
  getLocale.mockClear()
})

test('throws error if options is not present', () => {
  expect(() => (recommendations())).toThrow()
})

describe('testing basic', () => {
  beforeEach(() => {
    const language = 'en-gb'
    const currency = 'GBP'
    uv.emit('ecView', { language, currency })
    httpMock.__setRecs({
      result: {
        items: [ rec ]
      }
    })
    getLocale.mockImplementation(options => {
      return Promise.resolve([
        options.language || language,
        options.language || currency
      ].join('-').toLowerCase())
    })
  })

  test('requested url is correct', async () => {
    await recommendations(options).get()
    const calledUrl = httpMock.post.mock.calls[0][0]
    expect(calledUrl).toBe('https://recs.qubit.com/vc/recommend/2.0/menards?strategy=pop&id=123adwqddqdw&n=10&experienceId=123456&iterationId=600100&variationId=165767&locale=en-gb-gbp')
  })

  test('data passed is correct', async () => {
    await recommendations(options).get()
    const data = httpMock.post.mock.calls[0][1]
    expect(data).toBe(JSON.stringify({ h: ['all'] }))
  })

  test('called with the correct timeout', async () => {
    const EXPECTED_TIMEOUT = 1000
    await recommendations(options).get({ timeout: EXPECTED_TIMEOUT })
    const config = httpMock.post.mock.calls[0][2]
    expect(config).toEqual({ timeout: EXPECTED_TIMEOUT })
  })

  test('should call getLocale with current options', async () => {
    await recommendations(options).get()
    expect(getLocale.mock.calls[0][0].uv).toEqual(options.uv)
  })

  test('getLocale uses view event when no overrides present', async () => {
    const locale = await getLocale({ uv: options.uv })
    expect(locale).toEqual('en-gb-gbp')
  })

  test('config overrides view event locale when present', async () => {
    const config = {
      language: 'en-us',
      currency: 'USD'
    }
    const recommendations = require('../index.js')(options, config)
    await recommendations.get()
    expect(getLocale.mock.calls[0][0].language).toEqual(config.language)
    expect(getLocale.mock.calls[0][0].currency).toEqual(config.currency)
  })

  test('settings override view event locale when presting', async () => {
    const currencyOverride = 'USD'
    await recommendations(options).get({ currency: currencyOverride })
    expect(getLocale.mock.calls[0][0].currency).toEqual(currencyOverride)
  })

  test('responds with recs for basic setup', async () => {
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
