import { getClient as esClient, adjustQuery, adjustQueryParams, adjustIndexName, getHits, getTotals } from '@storefront-api/lib/elastic'
import { elasticsearch, SearchQuery, ElasticsearchQueryConfig } from 'storefront-query-builder'
import { Router, Request, Response } from 'express'
import { apiError } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import cache from '@storefront-api/lib/cache-instance'
import Logger from '@storefront-api/lib/logger'
import AttributeService from '@storefront-api/default-catalog/api/attribute/service'
import ProcessorFactory from '@storefront-api/default-catalog/processor/factory'
import loadCustomFilters from 'icmaa-catalog/helper/loadCustomFilters'

import { IConfig } from 'config'
import { sha3_224 } from 'js-sha3'
import bodybuilder from 'bodybuilder'
import jwt from 'jwt-simple'
import pick from 'lodash/pick'

async function _cacheStorageHandler (config: IConfig, output: Record<string, any>, headers: Record<string, any>, hash: string, tags = []): Promise<void> {
  if (config.get<boolean>('server.useOutputCache') && cache) {
    return cache.set(
      'api:' + hash,
      { output, headers },
      tags
    ).catch((err) => {
      Logger.error(err)
    })
  }
}

function _outputFormatter (responseBody: Record<string, any>, format = 'standard'): Record<string, any> {
  if (format === 'compact') { // simple formatter
    delete responseBody.took
    delete responseBody.timed_out
    delete responseBody._shards
    if (responseBody.hits) {
      delete responseBody.hits.max_score
      responseBody.total = getTotals(responseBody)
      responseBody.hits = responseBody.hits.hits.map(hit => {
        return Object.assign(hit._source, { _score: hit._score, _sort: hit.sort })
      })
    }
  }
  return responseBody
}

export default ({ config }: ExtensionAPIFunctionParameter) => async function (req: Request, res: Response): Promise<void | Router> {
  let groupId = null

  // Request method handling: exit if not GET or POST
  // Other methods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if (!(req.method === 'GET' || req.method === 'POST' || req.method === 'OPTIONS')) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')
  }

  let responseFormat = 'standard'
  let requestBody = req.body
  if (req.method === 'GET') {
    if (req.query.request) { // this is in fact optional
      try {
        requestBody = JSON.parse(decodeURIComponent(req.query.request as string))
      } catch (err) {
        throw new Error(err)
      }
    }
  }

  const urlSegments = req.url.split('/')

  let indexName = ''
  let entityType = ''
  let action = ''
  if (urlSegments.length < 2) {
    throw new Error('No index name given in the URL. Please do use following URL format:  /api/catalog/<index_name>/<entity_type>/<_search|_count>/')
  } else {
    indexName = urlSegments[1]

    try {
      if (urlSegments.length > 2) { entityType = urlSegments[2] }

      if (config.get<string[]>('elasticsearch.indices').indexOf(indexName) < 0) {
        throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format:  /api/catalog/<index_name>/<entity_type>/<_search|_count>/')
      }

      const lastSegment = urlSegments[urlSegments.length - 1]
      action = lastSegment.replace(/^(.*)\?.*/gm, '$1')
      if (!['_search', '_count'].includes(action)) {
        throw new Error('Please do use following URL format: /api/catalog/<index_name>/<entity_type>/<_search|_count>/')
      }
    } catch (err) {
      apiError(res, err)
      return
    }
  }

  if (req.query.request_format === 'search-query') { // search query and not Elastic DSL - we need to translate it
    const customFilters = Object.assign({}, loadCustomFilters())
    if (entityType !== '') {
      Object.assign(customFilters, loadCustomFilters(entityType))
    }

    requestBody = await elasticsearch.buildQueryBodyFromSearchQuery({
      config: config as ElasticsearchQueryConfig,
      queryChain: bodybuilder(),
      searchQuery: new SearchQuery(requestBody),
      customFilters
    })
  }

  let pit: { id: string, keep_alive: string } = req.query.pit ? { id: req.query.pit as string, keep_alive: '1m' } : null
  if (req.query.pit === '') {
    delete req.query.pit
    pit = await esClient(config)
      .openPointInTime({
        index: adjustIndexName(indexName, entityType, config),
        keep_alive: '1m'
      })
      .then((resp) => {
        return { id: resp.body.id, keep_alive: '1m' }
      })
      .catch(resp => {
        console.error('Couldn\'t fetch point-in-time for ', indexName, resp.message)
        return null
      })
  } else {
    delete req.query.pit
  }

  if (req.query.response_format) responseFormat = req.query.response_format as string

  // Decode token and get group id
  const userToken = requestBody.groupToken
  if (userToken && userToken.length > 10) {
    /**
     * We need to use try catch so when we change the keys for encryption that not every request with a loggedin user
     * fails with a 500 at this point.
     **/
    try {
      const decodeToken = jwt.decode(userToken, config.get<string>('authHashSecret') ? config.get<string>('authHashSecret') : config.get<string>('objHashSecret'))
      groupId = decodeToken.group_id || groupId
    } catch (err) {}
  } else if (requestBody.groupId) {
    groupId = requestBody.groupId || groupId
  }

  delete requestBody.groupToken
  delete requestBody.groupId

  const s = Date.now()
  const reqHash = sha3_224(`${JSON.stringify(requestBody)}${req.url}${pit?.id || ''}`)
  const dynamicRequestHandler = () => {
    const reqQuery = Object.assign({}, req.query)
    const reqQueryParams = adjustQueryParams(reqQuery, entityType, config)

    const query = adjustQuery({
      index: indexName,
      method: req.method,
      body: requestBody
    }, entityType, config)

    if (action === '_count') {
      const countRequest = pick(Object.assign(query, reqQueryParams), ['index', 'method', 'body'])
      delete countRequest?.body?.sort

      return esClient(config)
        .count(countRequest)
        .then(async response => {
          const _resBody = pick(response.body, ['count'])
          await _cacheStorageHandler(config, _resBody, res.getHeaders(), reqHash, [])
          res.json(_resBody)
        })
        .catch(err => {
          apiError(res, err)
        })
    }

    if (pit) {
      delete query.index
      query.body.pit = pit
    }

    esClient(config)
      .search(Object.assign(query, reqQueryParams))
      .then(async response => {
        let { body: _resBody } = response

        if (_resBody.error) {
          Logger.error('An error occured during catalog request:', _resBody.error)
          apiError(res, _resBody.error)
          return
        }

        try {
          const hits = getHits(_resBody)
          if (_resBody && hits) {
            // Backwards compatibility for <ES7 as it could be nested under `body`
            _resBody.hits.hits = hits

            const factory = new ProcessorFactory(config)
            const tagsArray = []
            const categoryTagsArray = []

            if (config.get<boolean>('server.useOutputCacheTagging')) {
              const tagPrefix = entityType[0].toUpperCase() // first letter of entity name: P, T, A ...
              tagsArray.push(entityType)
              _resBody.hits.hits.forEach(item => {
                if (item._source.id) { // has common identifier
                  tagsArray.push(`${tagPrefix}${item._source.id}`)

                  if (entityType === 'product' && item._source.category_ids !== undefined) {
                    item._source.category_ids
                      .filter(id => !categoryTagsArray.includes(`C${id}`))
                      .forEach(id => categoryTagsArray.push(`C${id}`))
                  }
                }
              })

              if (categoryTagsArray.length > 0) {
                tagsArray.push('category', ...categoryTagsArray)
              }

              const cacheTags = tagsArray.join(' ')
              res.setHeader('x-vs-cache-tags', cacheTags)
            }

            let resultProcessor = factory.getAdapter(entityType, indexName, req, res)

            if (!resultProcessor) { resultProcessor = factory.getAdapter('default', indexName, req, res) } // get the default processor

            const productGroupId = entityType === 'product' ? groupId : undefined
            const result = await resultProcessor.process(_resBody.hits.hits, productGroupId)
            _resBody.hits.hits = result
            if (entityType === 'product' && _resBody.aggregations && config.get<boolean>('entities.attribute.loadByAttributeMetadata')) {
              const attributeListParam = AttributeService.transformAggsToAttributeListParam(_resBody.aggregations)
              // find attribute list
              const attributeList = await AttributeService.list(attributeListParam, config, indexName)
              _resBody.attribute_metadata = attributeList.map(AttributeService.transformToMetadata)
            }

            _resBody = _outputFormatter(_resBody, responseFormat)

            await _cacheStorageHandler(config, _resBody, res.getHeaders(), reqHash, tagsArray)
          }

          res.json(_resBody)
        } catch (err) {
          apiError(res, err)
        }
      })
      .catch(err => {
        apiError(res, err)
      })
  }

  if (config.get<boolean>('server.useOutputCache') && cache) {
    cache.get(
      'api:' + reqHash
    ).then(result => {
      if (result !== null) {
        Object.keys(result?.headers || {}).forEach(k => res.setHeader(k, result?.headers[k]))
        res.setHeader('x-vs-cache', 'hit')
        res.json(result.output)
        Logger.debug(`Cache hit [${req.url}], cached request: ${Date.now() - s}ms`)
      } else {
        res.setHeader('x-vs-cache', 'miss')
        Logger.debug(`Cache miss [${req.url}], request: ${Date.now() - s}ms`)
        dynamicRequestHandler()
      }
    }).catch(err => Logger.error(err))
  } else {
    res.setHeader('x-vs-cache', 'disabled')
    dynamicRequestHandler()
  }
}
