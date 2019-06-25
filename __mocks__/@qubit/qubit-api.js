/* global jest */
var recs = {}

module.exports.query = jest.fn(() => Promise.resolve(recs))

module.exports.__setRecs = function (nextRecs) {
  recs = JSON.parse(JSON.stringify(nextRecs))
}
