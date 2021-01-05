import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const urlPrefix = 'order/'

  api.get('/last-order', async (req, res) => {
    const client = newMagentoClientAction('order', 'last', urlPrefix, config, req)
    client.order.last(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
