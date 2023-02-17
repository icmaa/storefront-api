import AbstractTaxProxy from '@storefront-api/platform-abstract/tax'
import { calculateProductTax, checkIfTaxWithUserGroupIsActive, getUserGroupIdToUse } from '@storefront-api/lib/taxcalc'

class TaxProxy extends AbstractTaxProxy {
  private readonly _deprecatedPriceFieldsSupport: any
  private readonly _taxCountry: any
  private readonly _taxRegion: any
  private _taxClasses: any

  public constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null, finalPriceInclTax = null) {
    super(config)
    this._entityType = entityType
    this._indexName = indexName
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    this._userGroupId = this._config.get('tax.userGroupId')
    this._storeConfigTax = this._config.get('tax')
    const storeViews = this._config.get<Record<string, any>>('storeViews')
    if (storeViews && storeViews.multistore) {
      for (const storeCode in storeViews) {
        const store = storeViews[storeCode]

        if (typeof store === 'object') {
          if (store.elasticsearch && store.elasticsearch.index) { // workaround to map stores
            if (store.elasticsearch.index === indexName) {
              taxRegion = store.tax.defaultRegion
              taxCountry = store.tax.defaultCountry
              sourcePriceInclTax = store.tax.sourcePriceIncludesTax || null
              finalPriceInclTax = store.tax.finalPriceIncludesTax || null
              this._storeConfigTax = store.tax
              break
            }
          }
        }
      }
    } else {
      if (!taxRegion) {
        taxRegion = this._config.get('tax.defaultRegion')
      }
      if (!taxCountry) {
        taxCountry = this._config.get('tax.defaultCountry')
      }
    }
    if (sourcePriceInclTax == null) {
      sourcePriceInclTax = this._config.get('tax.sourcePriceIncludesTax')
    }
    if (finalPriceInclTax == null) {
      finalPriceInclTax = this._config.get('tax.finalPriceIncludesTax')
    }
    this._deprecatedPriceFieldsSupport = this._config.get('tax.deprecatedPriceFieldsSupport')
    this._taxCountry = taxCountry
    this._taxRegion = taxRegion
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    this.taxFor = this.taxFor.bind(this)
  }

  public taxFor (product: any, groupId: any): Promise<any>|any {
    return calculateProductTax({
      product,
      taxClasses: this._taxClasses,
      taxCountry: this._taxCountry,
      taxRegion: this._taxRegion,
      sourcePriceInclTax: this._sourcePriceInclTax,
      deprecatedPriceFieldsSupport: this._deprecatedPriceFieldsSupport,
      finalPriceInclTax: this._finalPriceInclTax,
      userGroupId: groupId,
      isTaxWithUserGroupIsActive: checkIfTaxWithUserGroupIsActive(this._storeConfigTax) && typeof groupId === 'number'
    })
  }

  public process (productList: any[], groupId = null): Promise<any> {
    return new Promise(resolve => {
      for (const item of productList) {
        if (!item._source?.price) break
        const isActive = checkIfTaxWithUserGroupIsActive(this._storeConfigTax)
        groupId = isActive ? getUserGroupIdToUse(this._userGroupId, this._storeConfigTax) : null
        this.taxFor(item._source, groupId)
      }

      resolve(productList)
    })
  }
}

export default TaxProxy
