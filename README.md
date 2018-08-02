# Recommendations

The Recommendations API provides an endpoint to present a visitor with one or more products or content pieces that may be of interest. For example, recommended products to upsell on a basket page.

The API endpoint includes rate-limiting to prevent abuse. Currently, we allow at most 30 requests from the same IP address within a 10 second window.

## Configuration

You can override as little or as much of the configuration as shown in [Usage](#usage) examples below.

### strategy
*type*: `String`
*default*: `'pop'`

Can be:
- 'pp1' (viewed together or recently viewed if more than 1 seed is passed)
- 'pp3' (bought together)
- 'pop' (popular)

### limit
*type*: `Number`
*default*: `10`

A `Number` specifying the amount of recommendations you wish to return. The API might respond with less recommendations than the specified limit. If no recommendations are available, the promise will be rejected. See the [timeout](#timeout) section for how to handle errors.

### seed
*type*: `String` or `Array`
*default*: 'all'

You can seed (provide context to the recommendations API) with product IDs/SKUs (depending on your setup) and/or product categories. Product IDs/SKUs can be passed as `String`, however product categories must be passed as objects, e.g. `{ category: 'jeans' }`. Place within an `Array` to combine - see [Advanced](#advanced) usage example.

### rules
*type*: `Array`
*default*: not included

Rules can be globally defined in our backend configuration (see Data tools -> Recommendations in the Qubit app), but sometimes you may want to vary them per request. Refer to http://jsonlogic.com/ for the possible rule combinations.

### timeout
*type*: `Number`
*default*: `0`

The default of 0 miliseconds means no timeout will occur. Should you wish to cancel the loading of recommendations after a set time period, pass the timeout key and attach a `catch` block after your `then` to perform an alternate operation.

```js
const recommendations = require('@qubit/recommendations')(options)

recommendations.get().then((recs) => {
  console.log(recs)
}).catch((e) => {
  // perform alternate action
})
```

### trackingId
*type*: `String`
*default*: `options.meta.trackingId`

Should you wish to request recommendations for a different property (perhaps you are building on staging, but would like to request production recommendations), this can be set here.

### visitorId
*type*: `String`
*default*: `options.meta.visitorId`

This package assumes usage within a Qubit experience. If using elsewhere you can specify how the Qubit Visitor ID should be found - typically via the `_qubitTracker` cookie.

### url
*type*: `String`
*default*: `'https://recs.qubit.com/vc/recommend/2.0/'`

The Qubit Recommendations API endpoint.

## Usage

### Basic

Recommendations can be retrieved by only passing through the Experience API (`options`). Recommendations will be returned based on the defaults listed in the [Configuration](https://github.com/QubitProducts/recommendations#configuration) section above.

```js
const recommendations = require('@qubit/recommendations')(options)

recommendations.get().then((recs) => {
  console.log(recs)
})
```

### Standard

If you'll be making only one type of recommendations request where the strategy and number of products you wish to use will be the same, you can define this upfront by providing your own configuration. You can override any key shown in the [Configuration](#configuration) section above.

```js
const productId = options.state.get('productId')

const recommendations = require('@qubit/recommendations')(options, {
  strategy: 'pp1',
  limit: 20,
  seed: productId
})

recommendations.get().then((recs) => {
  console.log(recs)
})
```

### Advanced

Sometimes, we're required to implement a more custom recommendations call whereby we specify our configuration at the time of making the request. This approach is useful if you're required to make more than one request on a pageview.

Configuration passed to `get` overrides any configuration you pass when initialising the module (such as in the [Standard](#standard) example above). Any keys you leave out will fallback to the configuration passed when initialised or the defaults described in [Configuration](#configuration) if no initial configuration was used.

```js
const recommendations = require('@qubit/recommendations')(options)

recommendations.get({
  strategy: 'pp1',
  limit: 30,
  seed: [{ category: 'jeans' }, 'ABC123', { category: 'blazers' }],
  rules: [{
    condition: {
      '!==': [{
        var: 'rec.custom_field'
      }, {
        var: 'seed.custom_field'
      }]
    },
    factor: 0
  }]
}).then((recs) => {
  console.log(recs)
})
```

## Required events

To enable the metrics and reporting features within the Qubit app for a recommendations experience, implement the following events.

- When a recommendation is shown/rendered onto the page:

```js
recommendations.shown({
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop'
})
```

- When a recommendation is clicked:

```js
recommendations.clicked({
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop',
  position: 1
})
```

### Example

`id`, `weight` and `strategy` will be returned for every recommendation, so if you're looping through the API response to render recommendations, this data will be immediately available to make the `shown` call. Here's an example of how you might choose to emit `shown` and `clicked` events:

```js
const recommendations = require('@qubit/recommendations')(options)

recommendations.get().then((recs) => {
  const $recs = recs.map((product, i) => {
    const { details } = product

    recommendations.shown(product)

    return $(`
      <div class="t001-rec">
        <a href="${details.url}">
          <img class="t001-img" src="${details.image_url}" />
          <div class="t001-name">${details.name}</div>
          <div class="t001-price">${details.unit_sale_price}</div>
        </a>
      </div>
    `).click(() => {
      recommendations.clicked(_.assign({ position: i + 1 }, product))
    })
  })

  $(`.product-details`).append($recs)
}).catch(err => {
  console.log(err)
})
```

## Notes

If you're including this package in a Qubit experience, the `get` call should take place in triggers so you can verify a response prior to activating.
