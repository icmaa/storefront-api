# ICMAA - Spotify data extension

This API extension gets data from Spotify API

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-spotify", …],`

2. Add the configs to your `local.json`:
   ```json
   "extensions": {
     …
     "icmaaSpotify": {
       "clientId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
       "secretId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  },
   ```

3. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_spotify": {
     "endpoint": "/api/icmaa-spotify",
   }
   ```

## API endpoints
```
/api/ext/icmaa-spotify/related-artists/NAME
/api/icmaa-spotify/related-artists/NAME
```
