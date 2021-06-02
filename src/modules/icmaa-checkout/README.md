# ICMAA - Checkout data extension

This API extension gets extendend checkout & quote information from a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-checkout", …],`
2. Add the new endpoint to the VSF in `local.json` to:
   ```
   "icmaa_checkout": {
     "endpoints": {
        "agreements": "/api/icmaa-checkout/agreements",
        "syncQuote": "/sync-quote?token={{token}}&cartId={{cartId}}",
        "shippingMethods": "/shipping-methods?token={{token}}&cartId={{cartId}}",
        "order": "/order?token={{token}}&cartId={{cartId}}"
     }
   },
   ```

## API endpoints
```
/api/ext/icmaa-checkout/shipping-methods
/api/ext/icmaa-checkout/sync-quote
/api/ext/icmaa-checkout/agreements
/api/ext/icmaa-checkout/order
```
