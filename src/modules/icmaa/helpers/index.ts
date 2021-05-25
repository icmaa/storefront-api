import { Request } from 'express'
import { IConfig } from 'config'
import { multiStoreConfig } from '@storefront-api/platform-magento1/util'
import { Magento1Client as Magento1ClientType } from 'magento1-vsbridge-client'
import qs from 'query-string'

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

/**
* Add new action to `magento1-vsbridge-client` and `module` instance
*/
export const newMagentoClientAction = (moduleName = '', endpoint = '', urlPrefix = '/', config: IConfig, req: Request, query = ''): Magento1ClientType => {
  const client = Magento1Client(multiStoreConfig(config.get<Record<string, any>>('magento1.api'), req))
  client.addMethods(moduleName, (restClient) => {
    const module = {};
    module[endpoint] = function (reqData) {
      let url = urlPrefix + endpoint + query
      let queryParams = {}

      const token = req.query.token
      if (token) {
        queryParams = Object.assign(queryParams, { token })
      }

      const cartId = req.query.cartId
      if (cartId) {
        queryParams = Object.assign(queryParams, { cartId })
      }

      url = qs.stringifyUrl({
        url, query: queryParams
      })

      return restClient[req.method.toLowerCase()](url, reqData, token)
        .then(data => {
          return data.code === 200 ? data.result : false
        });
    }

    return module
  })

  return client
}
