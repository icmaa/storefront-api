import { FilterInterface } from 'storefront-query-builder'

import ActiveByDateRangeFilter from 'icmaa-catalog/api/filter/catalog/ActiveByDateRangeFilter'
import OrNorNullFilter from 'icmaa-catalog/api/filter/catalog/OrNorNullFilter'
import NullFilter from 'icmaa-catalog/api/filter/catalog/NullFilter'
import HotfixNorFilter from 'icmaa-catalog/api/filter/catalog/HotfixNorFilter'
import HotfixOrFilter from 'icmaa-catalog/api/filter/catalog/HotfixOrFilter'
import HotfixOrRangeFilter from 'icmaa-catalog/api/filter/catalog/HotfixOrRangeFilter'
import PrefixFilter from 'icmaa-catalog/api/filter/catalog/PrefixFilter'
import MapUrlFilter from 'icmaa-catalog/api/filter/catalog/MapUrlFilter'
import SearchAfter from 'icmaa-catalog/api/filter/catalog/SearchAfter'
import StockFilter from 'icmaa-catalog/api/filter/product/StockFilter'
import NestedFilter from 'icmaa-catalog/api/filter/product/NestedFilter'
import SearchTextQuery from 'icmaa-catalog/api/filter/product/SearchTextQuery'

const allFilters: Record<string, Record<string, FilterInterface>> = {
  catalog: {
    ActiveByDateRangeFilter,
    OrNorNullFilter,
    NullFilter,
    HotfixNorFilter,
    HotfixOrFilter,
    HotfixOrRangeFilter,
    PrefixFilter,
    MapUrlFilter,
    SearchAfter
  },
  product: {
    StockFilter,
    NestedFilter,
    SearchTextQuery
  }
}

/**
 * Originally this is used to dynamically call filters, but this seems to be
 * very slow despite the search on the filesystem. As we don't need a dynamic
 * import for that, we just call them statically instead and save a lot of time
 * on the first calls.
 */
export default function loadModuleCustomFilters (type = 'catalog'): Record<string, FilterInterface> {
  return allFilters[type] || {}
}
