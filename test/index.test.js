/* global test expect describe beforeEach */
const uv = require('uv-api')()
const recommendations = require('../index.js')
const defaults = require('../defaults.js')

const options = {
  emitMetric: () => uv.emit('qubit.metric'),
  uv: { emit: uv.emit },
  meta: { trackingId: 'menards' }
}

const rec = {
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop',
  position: 1
}

test('throws error if options is not present', () => {
  expect(() => (recommendations())).toThrow()
})

describe('testing basic', () => {
  test('responds with recs for basic setup', () => {
    expect.assertions(1)

    return recommendations(options).get().then((recs) => {
      expect(recs).toBeInstanceOf(Array)
    })
  })

  test('reponds with default limit of recs', () => {
    expect.assertions(1)

    return recommendations(options).get().then((recs) => {
      expect(recs).toHaveLength(defaults.limit)
    })
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
