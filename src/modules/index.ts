import 'icmaa-logs/lib/gcloud'

import { DefaultVuestorefrontApiModule } from '@storefront-api/default-vsf'
import { DefaultCatalogModule } from '@storefront-api/default-catalog'
import { DefaultImgModule } from '@storefront-api/default-img'
import { IcmaaModule } from 'icmaa'
import { StorefrontApiModule } from '@storefront-api/lib/module'
import * as magento1 from 'icmaa-platform-magento1'

export const modules: StorefrontApiModule[] = [
  DefaultVuestorefrontApiModule({
    platform: {
      name: 'magento1',
      platformImplementation: magento1
    }
  }),
  DefaultCatalogModule(),
  DefaultImgModule(),
  IcmaaModule
]

export default modules
