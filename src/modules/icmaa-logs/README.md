# ICMAA - Logging & tracing extension

...

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-logs", …],`
2. Add the following line on the very top of the applications modules entrypoint in `src/modules/index.ts`:
   ```ts
   import 'icmaa-logs/lib/gcloud'
   ```
