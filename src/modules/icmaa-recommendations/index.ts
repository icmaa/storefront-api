import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import gcpRetail from '@google-cloud/retail'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.get('/test', async (req, res) => {
    // const { spreadsheetId, form } = req.body

    const credentials = config.get<Record<string, any>>('extensions.icmaaRecommendations.googleServiceAccount')
    const client = new gcpRetail.PredictionServiceClient({
      credentials,
      projectId: credentials.project_id
    })

    const resp = await client.predict({
      validateOnly: false,
      placement: 'projects/icmaaadwords01/locations/global/catalogs/default_catalog/servingConfigs/recommended-for-you',
      userEvent: {
        eventType: 'detail-page-view',
        visitorId: 'GA1.2.1860065935.1692687468',
        productDetails: [{
          product: {
            id: '00073390'
          }
        }]
      }
    })

    apiStatus(res, resp[0].results, 200)
  })

  return api
}
