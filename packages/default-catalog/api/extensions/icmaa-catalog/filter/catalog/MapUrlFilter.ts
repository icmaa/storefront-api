import config from 'config'
import { FilterInterface } from 'storefront-query-builder'

const searchFields: string[] = config.get('urlModule.map.searchedFields') || []

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => attribute === 'mapUrl',
  filter ({ value, queryChain }) {
    if (!value) return queryChain

    searchFields.forEach(field => {
      queryChain.orFilter('term', field, value)

      const nestedSubcategoryQuery = this.bodybuilder()
        .query('term', 'genericSubcategories.' + field, value)
        .build()
      queryChain.orFilter('nested', { path: 'genericSubcategories', ...nestedSubcategoryQuery })
    })

    // Filter in-active child-categories
    queryChain.filter('bool', subQueryChain => {
      return subQueryChain
        .orFilter('bool', isCategoryQueryChain => {
          return isCategoryQueryChain
            .filter('term', 'is_active', true)
            .filter('wildcard', '_index', { value: '*_category_*' })
        })
        .orFilter('bool', isProductQueryChain => {
          return isProductQueryChain.notFilter('wildcard', '_index', { value: '*_category_*' })
        })
        .filterMinimumShouldMatch(1)
    })

    queryChain
      .filterMinimumShouldMatch(1)
      .size(1)

    return queryChain
  },
  mutator: v => v?.in[0] || false
}

export default filter
