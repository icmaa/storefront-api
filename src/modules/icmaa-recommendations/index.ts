import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import gcpRetail from '@google-cloud/retail'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.post('/list', async (req, res) => {
    const { servingConfigs, eventType, visitorId, userEvent } = req.body
    if (!servingConfigs || servingConfigs === '') return apiStatus(res, 'No servingConfigs provided', 400)
    if (!eventType || eventType === '') return apiStatus(res, 'No eventType provided', 400)
    if (!visitorId || visitorId === '') return apiStatus(res, 'No visitorId provided', 400)

    const additionalUserEvent = userEvent || {}
    const filter = req.body?.filter ? { filter: req.body?.filter } : {}
    const params = req.body?.params || {}

    const credentials = config.get<Record<string, any>>('extensions.icmaaRecommendations.googleServiceAccount')
    const { project_id: projectId } = credentials
    const client = new gcpRetail.PredictionServiceClient({
      credentials,
      projectId
    })

    const pageSize = req.body?.pageSize || 6
    const placement = `projects/${projectId}/locations/global/catalogs/default_catalog/servingConfigs/${servingConfigs}`

    /** @src https://cloud.google.com/retail/docs/reference/rest/v2/projects.locations.catalogs.servingConfigs/predict */
    await client.predict({
      validateOnly: false,
      placement,
      userEvent: {
        ...additionalUserEvent,
        eventType,
        visitorId
      },
      pageSize,
      params: { filterSyntaxV2: { boolValue: true }, ...params },
      ...filter
    }).then(resp => {
      if (resp[0]?.results) {
        apiStatus(res, resp[0].results.map(r => r.id), 200)
      } else {
        apiStatus(res, resp || {}, 200)
      }
    }).catch(err => {
      const { code, details: message } = err
      apiStatus(res, { code, message }, 500)
    })
  })

  return api
}
