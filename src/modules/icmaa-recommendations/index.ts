import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import gcpRetail from '@google-cloud/retail'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.post('/form', async (req, res) => {
    // const { spreadsheetId, form } = req.body

    apiStatus(res, 'true', 200)
  })

  return api
}
