import { FilterInterface } from 'storefront-query-builder'

const filter: FilterInterface = {
  priority: 1,
  check: ({ operator }) => ['prefix', 'startsWith'].includes(operator),
  filter: ({ value, attribute, queryChain }) => {
    if (value.length === 0) {
      return queryChain
    }

    return queryChain
      .filter('bool', subQuery => {
        subQuery.filterMinimumShouldMatch(1, true)
        value.forEach(v => subQuery.orFilter('prefix', attribute, v))
        return subQuery
      })
  },
  mutator: (value) => {
    value = value[Object.keys(value)[0]]
    if (!Array.isArray(value)) {
      value = [value]
    }
    return value
  }
}

export default filter
