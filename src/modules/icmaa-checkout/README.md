# ICMAA - Checkout data extension

This API extension gets extendend checkout & quote information from a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-checkout", …],`
2. Add the new endpoint to the VSF in `local.json` to:
   ```
   "icmaa_checkout": {
     "endpoints": {
        "agreements": "/api/icmaa-checkout/agreements"
     }
   },
   ```

## API endpoints
```
/api/ext/icmaa-checkout/agreements
/api/icmaa-checkout/agreements
```
