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

  api.post('/checkout_start', async (req, res) =>
    createNewClientActionProxy(req, res, 'icmaa-paypal', 'start', 'paypal_checkout/')
  )

  api.post('/checkout_shipping', async (req, res) =>
    createNewClientActionProxy(req, res, 'icmaa-paypal', 'shipping', 'paypal_checkout/')
  )

  api.post('/checkout_approve', async (req, res) =>
    createNewClientActionProxy(req, res, 'icmaa-paypal', 'approve', 'paypal_checkout/')
  )

  api.post('/checkout_capture', async (req, res) =>
    createNewClientActionProxy(req, res, 'icmaa-paypal', 'capture', 'paypal_checkout/')
  )

  return api
}
