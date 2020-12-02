import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter) => {
  const api = Router()

  const urlPrefix = 'giftcert/'

  api.post('/index', async (req, res) => {
    const client = newMagentoClientAction('giftcert', 'index', urlPrefix, config, req)
    client.giftcert.index(req.body)
      .then(result => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
