import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const urlPrefix = 'cart/'

  const action = (endpoint) => async (req, res) => {
    const client = newMagentoClientAction('cart', endpoint, urlPrefix, config, req)
    client.cart[endpoint](req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  }

  api.get('/agreements', action('agreements'))

  return api
}
