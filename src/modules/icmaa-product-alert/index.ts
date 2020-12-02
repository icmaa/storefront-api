import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import { newMagentoClientAction } from 'icmaa/helpers'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const urlPrefix = 'productalert/'

  const stockAction = async (req, res) => {
    const client = newMagentoClientAction('productalert', 'stock', urlPrefix, config, req)
    client.productalert.stock(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  }

  api.post('/stock', stockAction)
  api.delete('/stock', stockAction)

  api.get('/stocklist', async (req, res) => {
    const client = newMagentoClientAction('productalert', 'stocklist', urlPrefix, config, req)
    client.productalert.stocklist(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
