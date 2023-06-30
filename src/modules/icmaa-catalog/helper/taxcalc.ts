function isSpecialPriceActive (fromDate: string|Date, toDate: string|Date) {
  if (!fromDate && !toDate) {
    return true
  }

  const now = new Date()
  fromDate = fromDate ? new Date(fromDate) : null
  toDate = toDate ? new Date(toDate) : null

  if (fromDate && toDate) {
    return fromDate < now && toDate > now
  }

  if (fromDate && !toDate) {
    return fromDate < now
  }

  if (!fromDate && toDate) {
    return toDate > now
  }
}

/**
 * Create price object with base price and tax
 * @param price - product price which is used to extract tax value
 * @param rateFactor - tax % in decimal
 * @param isPriceInclTax - determines if price already include tax
 */
function createSinglePrice (price = 0, rateFactor = 0, isPriceInclTax: boolean) {
  const _price = isPriceInclTax ? price / (1 + rateFactor) : price
  const tax = _price * rateFactor

  return { price: _price, tax }
}

/**
 * assign price and tax to product with proper keys
 * @param AssignPriceParams
 */
function assignPrice ({ product, target, price = 0, tax = 0 }) {
  Object.assign(product, {
    [target]: price,
    [`${target}_tax`]: tax,
    [`${target}_incl_tax`]: price + tax
  })
}

export function updateProductPrices ({ product, rate, sourcePriceInclTax = false, finalPriceInclTax = true }) {
  const rate_factor = parseFloat(rate.rate) / 100
  const hasOriginalPrices = (
    Object.prototype.hasOwnProperty.call(product, 'original_price') &&
    Object.prototype.hasOwnProperty.call(product, 'original_final_price') &&
    Object.prototype.hasOwnProperty.call(product, 'original_special_price')
  )

  // build objects with original price and tax
  // for first calculation use `price`, for next one use `original_price`
  const priceWithTax = createSinglePrice(parseFloat(product.original_price || product.price), rate_factor, sourcePriceInclTax && !hasOriginalPrices)
  const finalPriceWithTax = createSinglePrice(parseFloat(product.original_final_price || product.final_price), rate_factor, finalPriceInclTax && !hasOriginalPrices)
  const specialPriceWithTax = createSinglePrice(parseFloat(product.original_special_price || product.special_price), rate_factor, sourcePriceInclTax && !hasOriginalPrices)

  // save original prices
  if (!hasOriginalPrices) {
    assignPrice({ product, target: 'original_price', ...priceWithTax })
    if (specialPriceWithTax.price) {
      product.original_special_price = specialPriceWithTax.price
    }
    if (finalPriceWithTax.price) {
      product.original_final_price = finalPriceWithTax.price
    }
  }

  // reset previous calculation
  assignPrice({ product, target: 'price', ...priceWithTax })
  if (specialPriceWithTax.price) {
    assignPrice({ product, target: 'special_price', ...specialPriceWithTax })
  }
  if (finalPriceWithTax.price) {
    assignPrice({ product, target: 'final_price', ...finalPriceWithTax })
  }

  if (product.final_price) {
    if (product.final_price < product.price) { // compare the prices with the product final price if provided; final prices is used in case of active catalog promo rules for example
      assignPrice({ product, target: 'price', ...finalPriceWithTax })
      if (product.special_price && product.final_price < product.special_price) { // for VS - special_price is any price lowered than regular price (`price`); in Magento there is a separate mechanism for setting the `special_prices`
        assignPrice({ product, target: 'price', ...specialPriceWithTax }) // if the `final_price` is lower than the original `special_price` - it means some catalog rules were applied over it
        assignPrice({ product, target: 'special_price', ...finalPriceWithTax })
      } else {
        assignPrice({ product, target: 'price', ...finalPriceWithTax })
      }
    }
  }

  if (product.special_price && (product.special_price < product.original_price)) {
    if (!isSpecialPriceActive(product.special_from_date, product.special_to_date)) {
      // out of the dates period
      assignPrice({ product, target: 'special_price', price: 0, tax: 0 })
    } else {
      assignPrice({ product, target: 'price', ...specialPriceWithTax })
    }
  } else {
    // the same price as original; it's not a promotion
    assignPrice({ product, target: 'special_price', price: 0, tax: 0 })
  }

  if (product.configurable_children) {
    for (const configurableChild of product.configurable_children) {
      if (configurableChild.custom_attributes) {
        for (const opt of configurableChild.custom_attributes) {
          configurableChild[opt.attribute_code] = opt.value
        }
      }

      // update children prices
      updateProductPrices({ product: configurableChild, rate, sourcePriceInclTax, finalPriceInclTax })

      if ((configurableChild.price_incl_tax <= product.price_incl_tax) || product.price === 0) { // always show the lowest price
        assignPrice({
          product,
          target: 'price',
          price: configurableChild.price,
          tax: configurableChild.price_tax
        })
        assignPrice({
          product,
          target: 'special_price',
          price: configurableChild.special_price,
          tax: configurableChild.special_price_tax
        })
      }
    }
  }
}

export function calculateProductTax ({ product, sourcePriceInclTax = false, finalPriceInclTax = true }): void {
  updateProductPrices({ product, rate: { rate: 0 }, sourcePriceInclTax, finalPriceInclTax })

  product.price_incl_tax = product.price
  product.price_tax = 0
  product.special_price_incl_tax = 0
  product.special_price_tax = 0

  if (product.configurable_children) {
    for (const configurableChildren of product.configurable_children) {
      configurableChildren.price_incl_tax = configurableChildren.price
      configurableChildren.price_tax = 0
      configurableChildren.special_price_incl_tax = 0
      configurableChildren.special_price_tax = 0
    }
  }
}
