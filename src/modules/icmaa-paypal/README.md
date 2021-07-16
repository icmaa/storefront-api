# ICMAA - Checkout PayPal data extension

This API extension gets and sends informations for PayPal payments to the VSBrige in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-paypal", …],`
2. Add the new endpoint to the VSF in `local.json` to:
   ```
   "icmaa_paypal": {
      "endpoint": "/api/icmaa-paypal",
      "endpoints": {
         "bypass_start": "/bypass_start?token={{token}}&cartId={{cartId}}"
         "bypass_shipping": "/bypass_shipping?token={{token}}&cartId={{cartId}}"
      }
   },
   ```

## API endpoints
```
/api/icmaa-paypal/bypass_start
/api/icmaa-paypal/bypass_shipping
```
