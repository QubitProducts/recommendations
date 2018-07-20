/* eslint-disable no-console */
const _ = require('slapdash')
const $ = require('jquery')

const recommendations = require('../..')({
  uv: {
    emit: (...args) => {
      console.log('SENDING', args)
    }
  },
  emitMetric: (...args) => {
    console.log('SENDING', args)
  },
  meta: {
    trackingId: 'studio',
    visitorId: 'qubit-test'
  }
})

recommendations.get().then((recs) => {
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
    `).click((e) => {
      recommendations.clicked(_.assign({ position: i + 1 }, product))
    })
  })

  const $html = $(`
    <div class="t001-carousel">
      
    </div>
  `).append($recs)

  $('body').html($html)
}).catch(err => {
  console.log(err)
})
