import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const urlPrefix = 'wishlist/'

  const restAction = async (req, res) => {
    const client = newMagentoClientAction('wishlist', 'index', urlPrefix, config, req)
    client.wishlist.index(req.body)
      .then((result) => apiStatus(res, result, 200))
      .catch(err => apiStatus(res, err, 500))
  }

  api.get('/index', restAction)
  api.post('/index', restAction)
  api.delete('/index', restAction)

  return api
}
