# ICMAA - Headless cms data extension

This API extension get data from headless cms of choice.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-cms", …],`

2. Add the configs to your `local.json`:
   ```json
   "extensions": {
     ...
     "icmaaCms": {
       "service": "prismic", // prismic | storyblok
       "prismic": {
         "apiEndpoint": "https://YOUR-ENDPOINT.cdn.prismic.io/api/v2",
         "apiToken": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
         "fallbackLanguage": "de-de"
       },
       "storyblok": {
         "spaceId": "XXXXX",
         "accessToken": "XXXXXXXXXXXXXXXXXXXXXXXX",
         "version": "draft", // Optional: published | draft"
         "defaultLanguageCodes": [ "default", "en" ],
         "pluginFieldMap": [
          { "key": "icmaa-single-option", "values": [ "selected" ] },
          { "key": "icmaa-multi-option", "values": [ "selected" ] },
          { "key": "icmaa-syntax-highlighter", "values": [ "data" ] },
          ...
        ]
       }
    }
  },
   ```

3. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_cms": {
     "endpoint": "/api/icmaa-cms"
   }
   ```

## API endpoints
```
/api/ext/icmaa-cms/by-uid?uid=navigation-main&type=block&lang=de-de
/api/icmaa-cms/by-uid?uid=navigation-main&type=block&lang=de-de
/api/ext/icmaa-cms/search?type=block&lang=de-de&q={"identifier":%20{"in":%20"navigation-meta,navigation-main"}}
/api/icmaa-cms/search?type=block&lang=de-de&q={"identifier":%20{"in":%20"navigation-meta,navigation-main"}}
```

## Scripts

### `datapump teaser -l de`

This script does pump all data of a specific content-type from Storyblok into an ElasticSearch index.

It fetches the data like it would be fetched by the `/search` endpoint and formats it so the data-format is the same as we fetch it from the ES.

The Storyblok query-language is pretty limited so this would be able to make more complex queries against CMS data.

```bash
# From workspace root:
yarn workspace icmaa-cms datapump import teaser -l de
# From module directory
yarn datapump import teaser -l de
```
