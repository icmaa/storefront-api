import config from 'config'
import { FilterInterface } from 'storefront-query-builder'

const searchFields: string[] = config.get('urlModule.map.searchedFields') || []

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => attribute === 'mapUrl',
  filter: ({ value, queryChain }) => {
    if (!value) return queryChain

    searchFields.forEach(field => {
      queryChain.orFilter('match_phrase', field, { query: value })
    })

    queryChain
      .filterMinimumShouldMatch(1)
      .size(1)

    return queryChain
  },
  mutator: v => v?.in[0] || false
}

export default filter
