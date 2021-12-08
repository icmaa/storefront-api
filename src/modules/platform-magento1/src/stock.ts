import AbstractStockProxy from '@storefront-api/platform-abstract/stock';
import { multiStoreConfig } from './util';

class StockProxy extends AbstractStockProxy {
  public constructor (config, req) {
    const Magento1Client = require('icmaa-magento1-vsbridge-client').default;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }

  public check (data) {
    return this.api.stock.check(data.sku);
  }
}

export default StockProxy;
