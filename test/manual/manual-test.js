/* eslint-disable no-console */
const uv = require('uv-api')()
const _ = require('slapdash')
const $ = require('jquery')
const testProperty = require('./test-property')

const recommendations = require('../..')({
  uv: { emit: uv.emit, on: uv.on },
  emitMetric: () => {},
  meta: testProperty
}, {
  url: 'https://api-dev.qubit.com/graphql',
  strategy: 'engagement',
  seed: 'OF1741',
  limit: 5
})

uv.emit('ecView', {
  language: 'en-gb',
  currency: 'gbp'
})

recommendations
  .get()
  .then(recs => {
    console.log(recs)
    const $recs = recs.map((product, i) => {
      const { details } = product

      recommendations.shown(product)

      return $(`
      <div class="t001-rec" style='display: inline-block; width: 100px; overflow: hidden; margin: 20px;'>
        <a href="${details.url}">
          <img class="t001-img" src="${details.image_url}" style='width: 100%' />
          <div class="t001-name">${details.name}</div>
          <div class="t001-price">${details.unit_sale_price}</div>
        </a>
      </div>
    `).click(e => {
        recommendations.clicked(_.assign({ position: i + 1 }, product))
      })
    })

    const $html = $(`
    <div class="t001-carousel">
      
    </div>
  `).append($recs)

    $('body').html($html)
  })
  .catch(err => {
    console.log(err)
  })
