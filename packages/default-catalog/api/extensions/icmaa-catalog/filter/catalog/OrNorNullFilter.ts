import { FilterInterface } from 'storefront-query-builder'

const filter: FilterInterface = {
  priority: 1,
  check: ({ operator }) => ['orNull', 'norNull'].includes(operator),
  filter: ({ value, attribute, queryChain, operator }) => queryChain
    .filter('bool', subQuery => {
      subQuery
        .filterMinimumShouldMatch(1, true)
        .orFilter('bool', b => b.notFilter('exists', attribute))

      if (value.length > 0) {
        if (operator === 'norNull') {
          subQuery.orFilter('bool', c => {
            return c.notFilter('terms', attribute, value)
          })
        } else {
          subQuery.orFilter('terms', attribute, value)
        }
      }

      return subQuery
    }),
  mutator: (value) => value[Object.keys(value)[0]]
}

export default filter
