import { DefaultVuestorefrontApiModule } from '@storefront-api/default-vsf'
import { DefaultCatalogModule } from '@storefront-api/default-catalog'
import { DefaultImgModule } from '@storefront-api/default-img'
import { IcmaaMonitoringModule } from 'icmaa-monitoring'
import { IcmaaModule } from 'icmaa'
import { StorefrontApiModule } from '@storefront-api/lib/module'
import * as magento1 from '@storefront-api/platform-magento1'

export const modules: StorefrontApiModule[] = [
  IcmaaMonitoringModule,
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
