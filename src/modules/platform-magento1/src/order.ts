import AbstractOrderProxy from '@storefront-api/platform-abstract/order'
import { multiStoreConfig } from './util'

class OrderProxy extends AbstractOrderProxy {
  public constructor (config, req) {
    const Magento1Client = require('icmaa-magento1-vsbridge-client').default
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req))
  }

  public create (orderData) {
    return this.api.order.create(orderData)
  }
}

export default OrderProxy
