import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import GoogleRecaptcha from 'icmaa/helpers/googleRecaptcha'
import Redis from 'icmaa/helpers/redis'
import { google } from 'googleapis'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.post('/form', async (req, res) => {
    const { spreadsheetId, form } = req.body

    const recaptcha = await GoogleRecaptcha(form.recaptcha, config)
    if (recaptcha !== true) {
      apiStatus(res, recaptcha as string, 500)
      return
    } else {
      delete form.recaptcha
    }

    const redisTagCache = Redis(config, `form-${spreadsheetId}`)
    if (form.ip) {
      if (await redisTagCache.get(form.ip)) {
        apiStatus(res, 'Your IP has already been used.', 500)
        redisTagCache.redis.quit()
        return
      }
    }

    const credentials = config.get<Record<string, any>>('icmaa.googleServiceAccount')
    const clientOptions = { subject: credentials.subject }
    const scopes = ['https://www.googleapis.com/auth/spreadsheets']
    const auth = new google.auth.GoogleAuth({ scopes, clientOptions, credentials })
    const client = await auth.getClient()

    // We can't go on here because we need domain-wide acces to docs
    // @see https://stackoverflow.com/questions/44827662/whitelisting-service-account-for-google-drive-document-access
    // @see https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority

    // We need to use an account of our domain (`clientOptions.subject`) to connect using the service-account, this account must also
    // have privelleges to edit the desired sheet. This is because of the domain-restrictions in the G-Suite. We use the service-account to
    // authenticate as an coporate account.

    // If the error "unauthorized_client" appears, delete and recreate the client in admin-console.
    // @see https://developers.google.com/identity/protocols/oauth2/service-account#error-codes

    const sheetsApi = google.sheets('v4')
    await sheetsApi.spreadsheets.values
      .append({
        auth: client,
        spreadsheetId,
        range: 'A1',
        includeValuesInResponse: true,
        valueInputOption: 'raw',
        requestBody: {
          values: [
            Object.values(form)
          ]
        }
      })
      .then(async () => {
        if (form.ip) {
          await redisTagCache.set(form.ip, true, [])
        }

        apiStatus(res, 'true', 200)
      })
      .catch(err => {
        apiStatus(res, err.message, 500)
      })
      .finally(() => {
        redisTagCache.redis.quit()
      })
  })

  return api
}
