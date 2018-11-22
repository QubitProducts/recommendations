/* global test expect describe beforeEach afterEach */
const uv = require('uv-api')()
const recommendations = require('../index.js')
const httpMock = require('@qubit/http-api')

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
})

test('throws error if options is not present', () => {
  expect(() => (recommendations())).toThrow()
})

describe('testing basic', () => {
  beforeEach(() => {
    uv.emit('ecView', { language: 'en-gb', currency: 'GBP' })
    httpMock.__setRecs({
      result: {
        items: [ rec ]
      }
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
  })

  test('shown event emits 2 qp events', () => {
    recommendations(options).shown(rec)
    expect(uv.events).toHaveLength(2)
  })
})
