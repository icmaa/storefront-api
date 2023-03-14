import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { getClient as getElasticClient, getHits } from '@storefront-api/lib/elastic'
import { apiStatus, getCurrentStoreView, getCurrentStoreCode } from '@storefront-api/lib/util'
import cache from '@storefront-api/lib/cache-instance'
import Logger from '@storefront-api/lib/logger'
import loadCustomFilters from 'icmaa-catalog/helper/loadCustomFilters'
import ProcessorFactory from '@storefront-api/default-catalog/processor/factory'

import { Router } from 'express'
import { IConfig } from 'config'
import { elasticsearch, SearchQuery, ElasticsearchQueryConfig } from 'storefront-query-builder'
import bodybuilder from 'bodybuilder'
import get from 'lodash/get'

const buildQuery = async ({ config, value }) => {
  const customFilters = Object.assign({}, loadCustomFilters())

  const query = new SearchQuery()
    .applyFilter({ key: 'mapUrl', value })
    .applyFilter({ key: 'activeDateRange', value: '' })

  return elasticsearch.buildQueryBodyFromSearchQuery({
    config: config as ElasticsearchQueryConfig,
    queryChain: bodybuilder(),
    searchQuery: query,
    customFilters
  })
}

const getIndexNamesByTypes = ({ indexName, config }) => {
  return get(config, 'urlModule.map.searchedEntities', [])
    .map(entity => `${indexName}_${entity}`)
}

const addResultTypeByIndexName = ({ result, indexName }) => {
  const type = result._index.replace(new RegExp(`^(${indexName}_)|(_[^_]*)$`, 'g'), '')
  result._type = type
  return result
}

export default ({ config }: ExtensionAPIFunctionParameter): Router => {
  const router = Router()

  async function _cacheStorageHandler (config: IConfig, output: Record<string, any>, headers: Record<string, any>, cacheKey: string, tags = []): Promise<void> {
    if (config.get<boolean>('server.useOutputCache') && cache) {
      return cache.set(
        cacheKey,
        { output, headers },
        tags
      ).catch((err) => {
        Logger.error(err)
      })
    }
  }

  router.post('/map', async (req, res) => {
    const s = Date.now()
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500)
    }

    const storeCode = getCurrentStoreCode(req)
    const cacheKey = `api:${storeCode || 'default'}:${url}`

    if (config.get<boolean>('server.useOutputCache') && cache) {
      const isCached = await cache.get(cacheKey)
        .then(result => {
          if (result !== null) {
            Object.keys(result?.headers || {}).forEach(k => res.setHeader(k, result?.headers[k]))
            res.setHeader('x-vs-cache', 'hit')
            res.json(result.output)

            Logger.debug(`Cache hit [${req.url}], cached request: ${Date.now() - s}ms`)

            return true
          } else {
            res.setHeader('x-vs-cache', 'miss')
            Logger.debug(`Cache miss [${req.url}], request: ${Date.now() - s}ms`)
            return false
          }
        })
        .catch(err => {
          Logger.error(err)
          return false
        })

      if (isCached) return
    } else {
      res.setHeader('x-vs-cache', 'disabled')
    }

    const indexName = getCurrentStoreView(storeCode).elasticsearch.index
    const index = getIndexNamesByTypes({ indexName, config })
    const body = await buildQuery({ value: url, config })

    const esQuery = {
      index,
      _source_includes: includeFields ? includeFields.concat(get(config, 'urlModule.map.includeFields', [])) : [],
      _source_excludes: excludeFields ? excludeFields.concat(get(config, 'urlModule.map.excludeFields', [])) : [],
      body
    }

    try {
      const esResponse = await getElasticClient(config).search(esQuery)
      let result = getHits(esResponse)[0]

      if (result) {
        result = addResultTypeByIndexName({ result, indexName })

        const factory = new ProcessorFactory(config)
        let resultProcessor = factory.getAdapter(result._type, indexName, req, res)
        if (!resultProcessor) {
          resultProcessor = factory.getAdapter('default', indexName, req, res)
        }

        const tagsArray = [result._type]
        const tagPrefix = result._type[0].toUpperCase()
        tagsArray.push(`${tagPrefix}${result?._id}`)

        if (config.get<boolean>('server.useOutputCacheTagging')) {
          const cacheTags = tagsArray.join(' ')
          res.setHeader('x-vs-cache-tags', cacheTags)
        }

        resultProcessor
          .process(esResponse.body.hits.hits, null)
          .then(async pResult => {
            pResult = pResult.map(h => Object.assign(h, { _score: h._score }))
            await _cacheStorageHandler(config, pResult[0], res.getHeaders(), cacheKey, tagsArray)
            return res.json(pResult[0])
          }).catch((err) => {
            console.error(err)
            return res.json()
          })
      } else {
        return res.json(null)
      }
    } catch (err) {
      console.error(err)
      return apiStatus(res, err.message, 500)
    }
  })

  return router
}
