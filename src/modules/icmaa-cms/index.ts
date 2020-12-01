import { StorefrontApiModule } from '@storefront-api/lib/module'

export const TemplateModule: StorefrontApiModule = new StorefrontApiModule({
  key: 'icmaa-cms',
  initApi: (): void => {
    // ...
  }
})
