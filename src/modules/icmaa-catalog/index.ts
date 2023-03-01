import { StorefrontApiModule, registerExtensions } from '@storefront-api/lib/module/index'
import { StorefrontApiContext } from '@storefront-api/lib/module/types'
import { invalidate, invalidateAll } from 'icmaa-catalog/api/invalidate'
import catalog from '@storefront-api/default-catalog/api/catalog'

import defaultProcessor from '@storefront-api/default-catalog/processor/default'
import productProcessor from '@storefront-api/default-catalog/processor/product'

import ProcessorFactory from '@storefront-api/default-catalog/processor/factory'
import path from 'path'

const catalogModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-catalog',
  initApi: ({ config, db, app }: StorefrontApiContext): void => {
    registerExtensions({ app, config, db, registeredExtensions: config.get('modules.defaultCatalog.registeredExtensions'), rootPath: path.join(__dirname, 'api', 'extensions') })

    app.use('/api/catalog', catalog({ config, db }))
    app.get('/api/icmaa-invalidate', invalidate)
    app.get('/api/icmaa-invalidate/all', invalidateAll)
  }
})

export const IcmaaCatalogModule = (processors = []): StorefrontApiModule => {
  ProcessorFactory.addAdapter('default', defaultProcessor)
  ProcessorFactory.addAdapter('product', productProcessor)

  processors.forEach(processor => {
    ProcessorFactory.addAdapter(processor.name, processor.class)
  })

  return catalogModule
}
