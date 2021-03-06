import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import Axios from 'axios'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  api.get('/related-artists/:name', async (req, res) => {
    const { name } = req.params

    /**
     * Use the Client Credential flow
     * @see https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-flows
     */
    const apiTokenUrl = 'https://accounts.spotify.com/api/token'
    const username = config.get<string>('extensions.icmaaSpotify.clientId')
    const password = config.get<string>('extensions.icmaaSpotify.secretId')

    const accessToken = await Axios.post(apiTokenUrl, null, {
      params: { grant_type: 'client_credentials' },
      auth: { username, password }
    }).then(response => response.data.access_token)
      .catch(() => false)

    if (!accessToken || accessToken === '') {
      return apiStatus(res, 'Couldn\'t fetch access-token', 400)
    }

    const apiUrl = 'https://api.spotify.com/v1'
    const artistId = await Axios.get(apiUrl + '/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: name, type: 'artist' }
    }).then(resp => resp.data.artists.items.length > 0 ? resp.data.artists.items[0].id : false)
      .catch(err => ({ error: err.response.data }))

    if (!artistId) {
      return apiStatus(res, 'Artist not found', 400)
    } else if (artistId.error !== undefined) {
      return apiStatus(res, artistId, 400)
    }

    return Axios.get(apiUrl + `/artists/${artistId}/related-artists`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(resp => {
      if (resp.data.artists.length > 0) {
        const relatedArtists = resp.data.artists
          .sort((a, b) => a.popularity > b.popularity ? -1 : 1)
          .map(artist => artist.name)
        return apiStatus(res, relatedArtists, 200)
      }

      return apiStatus(res, 'No related artists not found', 400)
    }).catch(err => apiStatus(res, err.response.data, 400))
  })

  return api
}
