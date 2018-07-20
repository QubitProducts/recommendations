# Product Recommendations

## Usage

### Basic

Recommendations can be retrieved by only passing through the Experience API. This will default to the settings found in `defaults.js`: `pop` for strategy, `10` items and `all` for the seed.

```js
const recommendations = require('@qubit/recommendations')(options)

recommendations.get().then((recs) => {
  console.log(recs)
})
```

### Standard

If you'll be making only one type of recommendations request where the strategy and number of products you wish to use will be the same, you can define this upfront by providing overrides. You can override any key found in `defaults.js` plus `trackingId` (detailed further down). If `trackingId` is not specified, it will use the `trackingId` from the `options` you pass through.

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

Configuration passed to `get` overrides any configuration you pass when initialising the module (such as in the "Standard" example). Any keys you leave out will fallback to the configuration passed when initialised or the defaults described in "Basic" if no initialisation configuration was used.

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

## API/Overrides

You can override as little or as much of the configuration as shown in examples above.

### strategy
*optional* / `String`
Can be:

- 'pp1' (viewed together or recently viewed if more than 1 seed is passed)
- 'pp3' (bought together)
- 'pop' (popular)

### limit
*required*: optional
*type*: `Number`
*default*: 'pop'

A `Number` specifying the amount of recommendations you wish to return. The API might respond with less recommendations than the specified limit. If no recommendations are available, the promise will be rejected. See the [timeout](#timeout) section for how to handle errors.

### seed
*required*: optional
*type*: `String` or `Array`
*default*: 'all'

You can seed with product IDs/SKUs (depending on your setup) and/or product categories. Product IDs/SKUs can be passed as `String`, however product categories must be passed as objects, e.g. `{ category: 'jeans' }`. Place within an `Array` to combine - see Advanced example.

### rules
*required*: optional
*type*: `Array`
*default*: not included

These are usually defined in our backend configuration, but sometimes you may want to vary them per request. Refer to http://jsonlogic.com/ for the possible rule combinations.

### timeout
*required*: optional
*type*: `Number`
*default*: 0

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
*required*: optional
*type*: `String`
*default*: `options.meta.trackingId`

Should you wish to request recommendations for a different property (perhaps you are building on staging, but would like to request production recommendations), this can be set here.

### visitorId
*required*: optional
*type*: `String`
*default*: `options.meta.visitorId`

This package assumes usage within a Qubit experience. If using elsewhere you can specify how the Qubit Visitor ID should be found - typically via the `_qubitTracker` cookie.

### url
*required*: optional
*type*: `String`
*default*: 'https://recs.qubit.com/vc/recommend/2.0/'

The Qubit Recommendations API endpoint.

## Required events

Failing to implement these events will result in improper tracking and metrics of the recommendations experience.

`id`, `weight` and `strategy` will be returned for every recommendation, so if you're looping through to render this data will be immediately available to make the `shown` call. Here's an example of how you might choose to emit shown and clicked events:

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

- For when a recommendation is shown/rendered onto the page:

```js
recommendations.shown({
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop'
})
```

- For when a recommendation is clicked:

```js
recommendations.clicked({
  id: 'ABC123',
  weight: '0.9',
  strategy: 'pop',
  position: 1
})
```

## Notes

If you're including this package in a Qubit experience, the `get` call should take place in triggers so you can verify a response prior to activating.
