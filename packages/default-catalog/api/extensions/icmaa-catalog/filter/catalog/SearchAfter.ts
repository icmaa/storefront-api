import { FilterInterface } from 'storefront-query-builder'

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => ['searchAfter', 'search_after'].includes(attribute),
  filter: ({ queryChain, value }) => queryChain
    .rawOption('search_after', value)
}

export default filter
