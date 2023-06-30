import AbstractTaxProxy from '@storefront-api/platform-abstract/tax'
import { calculateProductTax } from 'icmaa-catalog/helper/taxcalc'

class TaxProxy extends AbstractTaxProxy {
  public constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null, finalPriceInclTax = null) {
    super(config)

    this._sourcePriceInclTax = sourcePriceInclTax || this._config.get('tax.sourcePriceIncludesTax')
    this._finalPriceInclTax = finalPriceInclTax || this._config.get('tax.finalPriceIncludesTax')
    this.taxFor = this.taxFor.bind(this)
  }

  public taxFor (product: any): Promise<any>|any {
    return calculateProductTax({
      product,
      sourcePriceInclTax: this._sourcePriceInclTax,
      finalPriceInclTax: this._finalPriceInclTax
    })
  }

  public process (productList: any[], groupId = null): Promise<any> {
    return new Promise(resolve => {
      for (const item of productList) {
        if (!item._source?.price) break
        this.taxFor(item._source)
      }

      resolve(productList)
    })
  }
}

export default TaxProxy
