import config from 'config'
import fetch from 'isomorphic-fetch'
import { RequestHandler } from 'express'
import Logger from '@storefront-api/lib/logger'
import cache from '@storefront-api/lib/cache-instance'
import { apiStatus } from '@storefront-api/lib/util'
import { ioRedis } from './helpers/redis'

export const invalidate: RequestHandler = async (req, res) => {
  if (config.get('server.useOutputCache')) {
    if (req.query.tag && req.query.key) {
      if (req.query.key !== config.get('server.invalidateCacheKey')) {
        return apiStatus(res, 'Invalid cache-key', 400)
      }
    } else {
      Logger.error('Invalid parameters for Clear cache request')
      return apiStatus(res, 'Invalid parameters for Clear cache request', 400)
    }

    const subPromises = []

    const availableCacheTags = config.get<string[]>('server.availableCacheTags')
    let tags = req.query.tag === '*' ? availableCacheTags : (req.query.tag as string).split(',')

    tags = tags.filter(tag => {
      const validTag = availableCacheTags.indexOf(tag) >= 0 || availableCacheTags.find(t => tag.indexOf(t) === 0)
      if (!validTag) Logger.error(`Invalid tag name ${tag}`)
      return validTag
    })

    if (tags.length === 0) {
      return apiStatus(res, 'No valid cache-tags', 400)
    }

    tags.forEach(tag => {
      const invalidateTag = cache
        .invalidate(tag)
        .then(() => {
          Logger.info(`Tags invalidated successfully for [${tag}]`)
        })

      subPromises.push(invalidateTag)
    })

    if (config.get<boolean>('server.invalidateCacheForwarding') && !req.query?.forwardedFrom) {
      const forwardUrl = config.get<string>('server.invalidateCacheForwardUrl') + tags.join(',') + '&forwardedFrom=api'
      const forward = fetch(forwardUrl, { compress: true })
        .then(async r => {
          if (r.headers.get('content-type') === 'text/html') {
            return { statusCode: r.status, response: await r.text() }
          }
          return r.json()
        })
        .catch(err => {
          Logger.error(`Forwarded cache request failed. Can't render repsonse for: ${forwardUrl}`, err)
          throw Error('Forwarded cache request failed. Can\'t render repsonse for.')
        })
        .then(r => {
          if (r.statusCode >= 400) {
            Logger.error(`Forwarded cache request failed: ${forwardUrl}`, r)
            throw Error('Forwarded cache request failed.')
          }
          Logger.info(`Forwarded cache request to: ${forwardUrl}`, r)
        })

      subPromises.push(forward)
    }

    return Promise.all(subPromises)
      .then(() => {
        return apiStatus(res, `Tags invalidated successfully [${req.query.tag}]`, 200)
      })
      .catch(error => {
        Logger.error('Error during cache-bust:', error)
        return apiStatus(res, `Error during cache-bust: ${error.message}`, 500)
      })
  }

  return apiStatus(res, 'Output-cache is disabled', 200)
}

export const invalidateAll: RequestHandler = async (req, res) => {
  if (config.get('server.useOutputCache')) {
    if (req.query?.key !== config.get('server.invalidateCacheKey')) {
      return apiStatus(res, 'Invalid cache-key', 400)
    }

    const redis = ioRedis(config)
    return redis.flushall()
      .then(() => {
        Logger.info('Cache invalidated successfully [complete]')
        return apiStatus(res, 'Cache invalidated successfully [complete]', 200)
      }).catch(error => {
        Logger.error('Cache invalidated failes [complete]:', error.message)
        return apiStatus(res, 'Cache invalidated failed [complete]: ' + error.message, 400)
      }).finally(() => {
        redis.quit()
      })
  }

  return apiStatus(res, 'Output-cache is disabled', 200)
}
