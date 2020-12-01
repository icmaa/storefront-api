import { StorefrontApiModule, registerExtensions } from '@storefront-api/lib/module'
import { StorefrontApiContext } from '@storefront-api/lib/module/types'
import path from 'path'

export const IcmaaModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-module',

  initApi: ({ config, db, app }: StorefrontApiContext): void => {
    registerExtensions({ app, config, db, registeredExtensions: config.get('modules.icmaa.registeredExtensions'), rootPath: path.join(__dirname, 'api', 'extensions') })
  }
})
