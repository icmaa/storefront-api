import winston from 'winston'
import expressWinston from 'express-winston'
import { StorefrontApiModule } from '@storefront-api/lib/module/index'
import { StorefrontApiContext } from '@storefront-api/lib/module/types'

export const IcmaaMonitoringModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-monitoring',
  initMiddleware: ({ config, app }: StorefrontApiContext): void => {
    if (config.get('extensions.icmaa-monitoring.datadog.enabled') === true) {
      app.use(expressWinston.logger({
        transports: [
          new winston.transports.File({ filename: `${process.cwd()}/dist/log/winston.error.log`, level: 'error' }),
          new winston.transports.File({ filename: `${process.cwd()}/dist/log/winston.combined.log` })
        ],
        format: winston.format.json()
      }))
    }
  }
})
