import { Router } from 'express'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { apiStatus } from '@storefront-api/lib/util'

import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const urlPrefix = 'user/'

  api.post('/login', async (req, res) => {
    const client = newMagentoClientAction('user', 'facebookauthorization', urlPrefix, config, req)
    client.user.facebookauthorization(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
