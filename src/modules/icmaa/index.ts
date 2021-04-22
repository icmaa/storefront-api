import { StorefrontApiModule, registerExtensions } from '@storefront-api/lib/module'
import { StorefrontApiContext } from '@storefront-api/lib/module/types'
import * as path from 'path'

export const IcmaaModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-module',

  initApi: ({ config, db, app }: StorefrontApiContext): void => {
    const rootPath = path.join(__dirname, '..')
    const registeredExtensions: string[] = config.get('modules.icmaa.registeredExtensions')
    registerExtensions({ app, config, db, registeredExtensions, rootPath })

    app.get('/_ah/warmup', (req, res) => res.send('Warm-Up for storefront-api'))
  }
})
