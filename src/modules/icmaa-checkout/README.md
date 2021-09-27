# ICMAA - Checkout data extension

This API extension gets extendend checkout & quote information from a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-checkout", …],`
2. Add the new endpoint to the VSF in `local.json` to:
   ```
   "icmaa_checkout": {
     "endpoint": "/api/icmaa-checkout",
     "endpoints": {
       "quote": "/quote?token={{token}}&cartId={{cartId}}",
       "shippingMethods": "/shipping-methods?token={{token}}&cartId={{cartId}}",
       "order": "/order?token={{token}}&cartId={{cartId}}"
     },
     // ...
   },
   ```

## API endpoints
```
/api/icmaa-checkout/shipping-methods
/api/icmaa-checkout/quote
/api/icmaa-checkout/agreements
/api/icmaa-checkout/order
```
