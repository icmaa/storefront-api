# ICMAA - Recommendations

...

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-recommendations", …],`
2. Add your Google Service-Account credentials as JSON to your `local.json` like:
   ```
   "extensions: {
     ...
     "icmaaRecommendations": {
       "googleServiceAccount": {
         "subject": "XXX@impericon.com",
         "type": "service_account",
         "project_id": "XXXXXXXXXXXXX",
         "private_key_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
         "private_key": "...",
         "client_email": "sample@projektid.iam.gserviceaccount.com",
         "client_id": "XXXXXXXXXXXXXXXXXXXXX",
         "auth_uri": "https://accounts.google.com/o/oauth2/auth",
         "token_uri": "https://oauth2.googleapis.com/token",
         "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
         "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/smaple%projektid.iam.gserviceaccount.com"
       }
     }
   },
   ```
3. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_recommendations": {
     "endpoint": "/api/icmaa-recommendations"
   }
   ```

## API endpoints
```
/api/ext/icmaa-recommendations/form
/api/icmaa-recommendations/form
```
