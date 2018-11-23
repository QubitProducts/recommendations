/* global jest */
var recs = '[]'

module.exports.post = jest.fn(() => Promise.resolve(recs))

module.exports.__setRecs = function (nextRecs) {
  recs = JSON.stringify(nextRecs)
}
