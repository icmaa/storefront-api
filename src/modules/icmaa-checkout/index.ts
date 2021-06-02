import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const createNewClientActionProxy = async (req, res, moduleName, endpoint, urlPrefix) => {
    const client = newMagentoClientAction(moduleName, endpoint, urlPrefix, config, req)
    client[moduleName][endpoint](req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  }

  api.post('/shipping-methods', async (req, res) =>
    createNewClientActionProxy(req, res, 'cart', 'shippingMethods', 'cart/')
  )

  api.post('/sync-quote', async (req, res) =>
    createNewClientActionProxy(req, res, 'cart', 'totals', 'cart/')
  )

  api.get('/agreements', async (req, res) =>
    createNewClientActionProxy(req, res, 'cart', 'agreements', 'cart/')
  )

  api.post('/order', async (req, res) =>
    createNewClientActionProxy(req, res, 'order', 'create', 'order/')
  )

  return api
}
