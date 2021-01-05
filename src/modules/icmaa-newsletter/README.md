# ICMAA - Newsletter data extension

This API extension gets subscriber information from a custom `vsf-bridge` endpoint in Magento.

It also adds an endpoint to create vouchers using the API.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-newsletter", …],`
2. Change the original endpoint of VSF in `local.json` to:
   ```
   "newsletter": {
     "endpoint": "/api/icmaa-newsletter/subscribe",
     "endpoint_voucher": {
       "birthday": "/api/icmaa-newsletter/birthday-voucher",
       "default": "/api/icmaa-newsletter/voucher"
     }
   }
   ```

## API endpoints
```
/api/ext/icmaa-newsletter/subscribe
/api/icmaa-newsletter/subscribe
/api/ext/icmaa-newsletter/voucher
/api/icmaa-newsletter/voucher
/api/ext/icmaa-newsletter/birthday-voucher
/api/icmaa-newsletter/birthday-voucher
```
