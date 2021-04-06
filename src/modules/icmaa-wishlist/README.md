# ICMAA - Wishlist data extension

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-wishlist", … ],`
2. Add the endpoint of VSF in `local.json` to:
   ```
   "icmaa_wishlist": {
    "endpoint": "/api/icmaa-wishlist",
    ...
   }
   ```

## API endpoints
```
/api/ext/icmaa-wishlist/index
```
