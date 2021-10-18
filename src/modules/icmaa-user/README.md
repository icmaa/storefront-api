# ICMAA - User

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-user", …],`
2. Add endpoints to VSF in `local.json`:
   ```
   "users": {
      "create": "/api/icmaa-user/create",
     "last_order": "/api/icmaa-user/last-order?token={{token}}"
   }
   ```

## API endpoints
```
/api/icmaa-user/create
/api/icmaa-user/last-order
```
