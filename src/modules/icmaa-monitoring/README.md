# ICMAA - Monitoring extension

This module includes a request logging middleware using `winson` and `express-winston` to be able to log each request in JSON format.

## Configuration

1. Add `icmaa-monitoring` as first module ins `src/index.ts` like:
2. ```
   export const modules: StorefrontApiModule[] = [
      IcmaaMonitoringModule,
      DefaultVuestorefrontApiModule({
         ...
      }),
      ...
   ]
   ```
5. Import the Datadog tracer on top of `src/index.ts` like:
   ```javascript
   import 'icmaa-monitoring/datadog/dd-trace'
   ```
6. Add configs to `local.json`:
   ```
   "icmaa_monitoring": {
      "datadog": {
        "enabled": true,
        "clientToken": "XXX"
      }
    }
   ```
