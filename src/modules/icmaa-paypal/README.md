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
         "checkout_start": "/checkout_start?token={{token}}&cartId={{cartId}}",
         "checkout_shipping": "/checkout_shipping?token={{token}}&cartId={{cartId}}",
         "checkout_approve": "/checkout_approve?token={{token}}&cartId={{cartId}}",
         "checkout_capture": "/checkout_capture?token={{token}}&cartId={{cartId}}"
      }
   },
   ```

## API endpoints
```
/api/icmaa-paypal/checkout_start
/api/icmaa-paypal/checkout_shipping
/api/icmaa-paypal/checkout_approve
/api/icmaa-paypal/checkout_capture
```
