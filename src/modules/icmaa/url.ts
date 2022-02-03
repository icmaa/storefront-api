import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { getClient as getElasticClient } from '@storefront-api/lib/elastic'
import { apiStatus, getCurrentStoreView, getCurrentStoreCode } from '@storefront-api/lib/util'
import loadCustomFilters from '@storefront-api/default-catalog/helper/loadCustomFilters'
import ProcessorFactory from '@storefront-api/default-catalog/processor/factory'

import { Router } from 'express'
import { elasticsearch, SearchQuery, ElasticsearchQueryConfig } from 'storefront-query-builder'
import bodybuilder from 'bodybuilder'
import get from 'lodash/get'

const buildQuery = async ({ config, value }) => {
  const customFilters = await loadCustomFilters(config)

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

const checkFieldValueEquality = ({ config, result, value }) => {
  /**
   * Checks result equality because ES can return record even if searched
   * value is not EXACLY what we want (check `match_phrase` in ES docs).
   */
  return get(config, 'urlModule.map.searchedFields', [])
    .some(f => result._source[f] === value)
}

export default ({ config }: ExtensionAPIFunctionParameter): Router => {
  const router = Router()

  router.post('/map', async (req, res) => {
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500)
    }

    const indexName = getCurrentStoreView(getCurrentStoreCode(req)).elasticsearch.index
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
      let result = get(esResponse, 'body.hits.hits[0]', null)

      if (result && checkFieldValueEquality({ config, result, value: url })) {
        result = addResultTypeByIndexName({ result, indexName })

        const factory = new ProcessorFactory(config)
        let resultProcessor = factory.getAdapter(result._type, indexName, req, res)
        if (!resultProcessor) {
          resultProcessor = factory.getAdapter('default', indexName, req, res)
        }

        resultProcessor
          .process(esResponse.body.hits.hits, null)
          .then(pResult => {
            pResult = pResult.map(h => Object.assign(h, { _score: h._score }))
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
