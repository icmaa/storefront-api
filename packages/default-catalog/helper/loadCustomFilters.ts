import path from 'path'
import { IConfig } from 'config'
import { FilterInterface } from 'storefront-query-builder'

const allFilters: Record<string, Record<string, FilterInterface>> = {}

export default async function loadModuleCustomFilters (config: IConfig, type = 'catalog'): Promise<Record<string, FilterInterface>> {
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
