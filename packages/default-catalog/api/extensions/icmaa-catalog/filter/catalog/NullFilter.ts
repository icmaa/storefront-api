import { FilterInterface } from 'storefront-query-builder'

const filter: FilterInterface = {
  priority: 1,
  check: ({ operator }) => ['isNull', 'notNull'].includes(operator),
  filter: ({ attribute, queryChain, operator }) => queryChain
    .filter('bool', subQuery => {
      if (operator === 'notNull') {
        subQuery.filter('exists', attribute)
      } else if (operator === 'isNull') {
        subQuery.notFilter('exists', attribute)
      }

      return subQuery
    }),
  mutator: (value) => value[Object.keys(value)[0]]
}

export default filter
