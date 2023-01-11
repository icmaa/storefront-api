import config from 'config'
import { FilterInterface } from 'storefront-query-builder'

const searchFields: string[] = config.get('urlModule.map.searchedFields') || []

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => attribute === 'mapUrl',
  filter ({ value, queryChain }) {
    if (!value) return queryChain

    searchFields.forEach(field => {
      queryChain.orFilter('term', field + '.keyword', value)
    })

    // Filter in-active child-categories
    queryChain.filter('bool', subQueryChain => {
      return subQueryChain
        .orFilter('bool', isCategoryQueryChain => {
          return isCategoryQueryChain
            .filter('term', 'is_active', true)
            .filter('wildcard', '_index', { value: '*_category_*' })
        })
        .orFilter('bool', noCategoryQueryChain => {
          return noCategoryQueryChain.notFilter('wildcard', '_index', { value: '*_category_*' })
        })
        .filterMinimumShouldMatch(1)
    })

    queryChain
      .filterMinimumShouldMatch(1, true)
      .size(1)

    return queryChain
  },
  mutator: v => v?.in[0] || false
}

export default filter
