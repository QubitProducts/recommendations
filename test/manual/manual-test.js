/* eslint-disable no-console */
const uv = require('uv-api')()
const _ = require('slapdash')
const $ = require('jquery')
const testProperty = require('./test-property')

const recommendations = require('../..')(
  {
    uv: {
      ...uv,
      emit: (...args) => {
        console.log('SENDING QP', args)
        uv.emit(...args)
      }
    },
    emitMetric: (...args) => {
      console.log('SENDING METRIC', args)
    },
    meta: testProperty
  },
  {
    strategy: 'engagement',
    seed: 'OF1741',
    limit: 10,
    experienceId: 123,
    rules: [
      {
        name: 'Blacklist high price',
        condition: { '>=': [{ var: 'rec.unit_price' }, 10] },
        factor: 0
      },
      {
        name: 'Promote Shirts-Tops',
        condition: { '===': [{ var: 'rec.category' }, 'Shirts-Tops'] },
        factor: 2
      }
    ]
  }
)

const recommendations2 = require('../..')(
  {
    uv: {
      ...uv,
      emit: (...args) => {
        console.log('SENDING QP', args)
        uv.emit(...args)
      }
    },
    emitMetric: (...args) => {
      console.log('SENDING METRIC', args)
    },
    meta: testProperty
  },
  {
    strategy: 'popular',
    limit: 10
  }
)

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
      <div class="t001-rec" style='display: inline-block; width: 100px; margin: 20px;'>
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

    const $html = $(`<div class="t001-carousel"></div>`).append($recs)

    $('body').append($html)
  })
  .catch(err => {
    console.log(err)
  })

recommendations2
  .get()
  .then(recs => {
    console.log(recs)
    const $recs = recs.map((product, i) => {
      const { details } = product

      recommendations.shown(product)

      return $(`
      <div class="t001-rec" style='display: inline-block; width: 100px; margin: 20px;'>
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

    const $html = $(`<div class="t002-carousel"></div>`).append($recs)

    $('body').append($html)
  })
  .catch(err => {
    console.log(err)
  })
