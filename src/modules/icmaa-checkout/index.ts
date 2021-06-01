import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.get('/agreements', async (req, res) => {
    const client = newMagentoClientAction('cart', 'agreements', 'cart/', config, req)
    client.cart.agreements(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  api.post('/order', async (req, res) => {
    const client = newMagentoClientAction('order', 'create', 'order/', config, req)
    client.order.create(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
