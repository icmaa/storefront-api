import 'icmaa-logs/lib/gcloud'

import { DefaultVuestorefrontApiModule } from '@storefront-api/default-vsf'
import { DefaultCatalogModule } from '@storefront-api/default-catalog'
import { IcmaaModule, IcmaaMiddleware } from 'icmaa'
import { StorefrontApiModule } from '@storefront-api/lib/module'
import * as magento1 from 'icmaa-platform-magento1'

export const modules: StorefrontApiModule[] = [
  IcmaaMiddleware,
  DefaultVuestorefrontApiModule({
    platform: {
      name: 'magento1',
      platformImplementation: magento1
    }
  }),
  DefaultCatalogModule(),
  IcmaaModule
]

export default modules
