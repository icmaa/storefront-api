import { Request } from 'express'
import { IConfig } from 'config'
import { multiStoreConfig } from 'icmaa-platform-magento1/src/util'
import Magento1Client, { Magento1Client as Magento1ClientType } from 'icmaa-magento1-vsbridge-client'
import qs from 'query-string'

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
