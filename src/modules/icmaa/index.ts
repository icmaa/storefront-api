import * as path from 'path'

import { StorefrontApiModule, registerExtensions } from '@storefront-api/lib/module'
import { StorefrontApiContext } from '@storefront-api/lib/module/types'
import registerLogger from './logger'
import url from './url'
import warmup from './warmup'

// Import custom middlewares before the first route,
// this often is a requirement for middlewares like `morgan`
export const IcmaaMiddleware: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-middleware',
  beforeRegistration: (context: StorefrontApiContext): void => {
    registerLogger(context)
  }
})

export const IcmaaModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-module',

  initApi: ({ config, db, app }: StorefrontApiContext): void => {
    const rootPath = path.join(__dirname, '..')
    const registeredExtensions: string[] = config.get('modules.icmaa.registeredExtensions')
    registerExtensions({ app, config, db, registeredExtensions, rootPath })

    app.use('/api/icmaa-url', url({ config, db }))

    app.get('/_ah/warmup', warmup)
  }
})
