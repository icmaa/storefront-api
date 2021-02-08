import cache from '@storefront-api/lib/cache-instance'
import { apiStatus } from '@storefront-api/lib/util'
import { Request } from 'express'

const hasCacheHeader = (req: Request): boolean => !!req.header('X-VS-Cache-Bypass')

const getCvByRequest = (req: Request): string|undefined => hasCacheHeader(req) ? 'flush-' + Date.now().toString() : undefined

const cacheResult = async (config: Record<string, any>, result: any, hash: string, tags: string[]): Promise<void> => {
  if (config.server.useOutputCache && cache) {
    await cache
      .set('api:' + hash, result, tags)
      .catch(err => {
        console.error(err)
      })
  }
}

const cacheHandler = async (config: Record<string, any>, res: Record<string, any>, hash: string, req: Request): Promise<boolean|string> => {
  if (!hasCacheHeader(req) && config.server.useOutputCache && cache) {
    return cache.get(
      'api:' + hash
    ).then(output => {
      if (output !== null) {
        res.setHeader('X-VS-Cache', 'Hit')
        return apiStatus(res, output, 200)
      }

      res.setHeader('X-VS-Cache', 'Miss')
      return false
    }).catch(err => {
      console.error(err)
      return false
    })
  }

  return new Promise(resolve => resolve(false))
}

export {
  cacheResult,
  cacheHandler,
  getCvByRequest
}
