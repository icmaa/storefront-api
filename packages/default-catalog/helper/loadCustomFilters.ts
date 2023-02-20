import path from 'path'
import { IConfig } from 'config'
import { FilterInterface } from 'storefront-query-builder'

import ActiveByDateRangeFilter from '../api/extensions/icmaa-catalog/filter/catalog/ActiveByDateRangeFilter'
import OrNorNullFilter from '../api/extensions/icmaa-catalog/filter/catalog/OrNorNullFilter'
import NullFilter from '../api/extensions/icmaa-catalog/filter/catalog/NullFilter'
import HotfixNorFilter from '../api/extensions/icmaa-catalog/filter/catalog/HotfixNorFilter'
import HotfixOrFilter from '../api/extensions/icmaa-catalog/filter/catalog/HotfixOrFilter'
import HotfixOrRangeFilter from '../api/extensions/icmaa-catalog/filter/catalog/HotfixOrRangeFilter'
import PrefixFilter from '../api/extensions/icmaa-catalog/filter/catalog/PrefixFilter'
import MapUrlFilter from '../api/extensions/icmaa-catalog/filter/catalog/MapUrlFilter'
import SearchAfter from '../api/extensions/icmaa-catalog/filter/catalog/SearchAfter'
import StockFilter from '../api/extensions/icmaa-catalog/filter/product/StockFilter'
import NestedFilter from '../api/extensions/icmaa-catalog/filter/product/NestedFilter'
import SearchTextQuery from '../api/extensions/icmaa-catalog/filter/product/SearchTextQuery'

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

export default async function loadModuleCustomFilters (config: IConfig, type = 'catalog'): Promise<Record<string, FilterInterface>> {
  return allFilters[type]
  if (allFilters[type]) {
    return allFilters[type]
  }

  const filters: Record<string, FilterInterface> = {}
  const filterPromises: Promise<void>[] = []

  for (const mod of config.get<string[]>('modules.defaultCatalog.registeredExtensions')) {
    if (config.has(`extensions.${mod}.${type}Filter`) && Array.isArray(config.get<string[]>(`extensions.${mod}.${type}Filter`))) {
      const moduleFilter = config.get<string[]>(`extensions.${mod}.${type}Filter`)
      const dirPath = [__dirname, '../api/extensions/' + mod + '/filter/', type]
      for (const filterName of moduleFilter) {
        const filePath = path.resolve(...dirPath, filterName)
        filterPromises.push(
          import(filePath)
            .then(module => {
              filters[filterName] = module.default
            })
            .catch(e => {
              console.log(e)
            })
        )
      }
    }
  }

  return Promise.all(filterPromises)
    .then(() => {
      allFilters[type] = filters
      return filters
    })
}
