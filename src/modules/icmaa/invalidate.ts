import config from 'config'
import { RequestHandler } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import Logger from '@storefront-api/lib/logger'
import { ioRedis } from './helpers/redis'

const router: RequestHandler = async (req, res) => {
  if (config.get('server.useOutputCache')) {
    if (req.query.key !== config.get('server.invalidateCacheKey')) {
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

export default router
