import Logger from '@storefront-api/lib/logger'
import OAuth from 'oauth-1.0a'
import request from 'request'

export default (options) => {
  const instance: any = {}

  const serverUrl = options.url
  const auth = options.auth ? { auth: options.auth } : {}
  const headers = options?.headers || {}

  const oauth = OAuth({
    consumer: {
      public: options.consumerKey,
      secret: options.consumerSecret
    },
    signature_method: 'HMAC-SHA1'
  })

  const token = {
    public: options.accessToken,
    secret: options.accessTokenSecret
  }

  function httpCallSucceeded (response) {
    return response.statusCode >= 200 && response.statusCode < 300
  }

  function errorString (message, parameters) {
    if (parameters === null) {
      return message
    }
    let parameterPlaceholder
    if (parameters instanceof Array) {
      for (let i = 0; i < parameters.length; i++) {
        parameterPlaceholder = '%' + (i + 1).toString()
        message = message.replace(parameterPlaceholder, parameters[i])
      }
    } else if (parameters instanceof Object) {
      for (const key in parameters) {
        parameterPlaceholder = '%' + key
        message = message.replace(parameterPlaceholder, parameters[key])
      }
    }

    return message
  }

  function createUrl (resourceUrl) {
    return serverUrl + '/' + resourceUrl
  }

  function apiCall (request_data, request_token = '') {
    const authToken = request_token
      ? { Authorization: 'Bearer ' + request_token }
      : { ...oauth.toHeader(oauth.authorize(request_data, token)) }

    const requestInfo = {
      url: request_data.url,
      method: request_data.method,
      ...auth,
      headers: { ...headers, ...auth, ...authToken },
      json: true,
      body: request_data.body
    }

    Logger.debug('Calling API endpoint', requestInfo)

    /* eslint no-undef: off */
    return new Promise((resolve, reject) => {
      const jar = request.jar()
      if (process.env.XDEBUG_SESSION) {
        const xdebugCookie = request.cookie('XDEBUG_SESSION=' + process.env.XDEBUG_SESSION)
        jar.setCookie(xdebugCookie, request_data.url)
      }

      request({
        url: request_data.url,
        method: request_data.method,
        ...auth,
        headers: { ...headers, ...authToken },
        json: true,
        body: request_data.body,
        jar
      }, (error, response, body) => {
        if (error) {
          Logger.error('Error occured: ' + error)
          reject(error)

          return
        } else if (!httpCallSucceeded(response)) {
          let errorMessage = ''

          if (body?.code) {
            errorMessage = 'ERROR ' + body.code
            if (body?.result) {
              errorMessage = errorString(body.result, body?.parameters || {})
            }
          } else {
            errorMessage = body
          }

          Logger.error('API call failed with: ' + errorMessage, '', requestInfo)
          reject(errorMessage)

          return
        }

        Logger.debug('API response received', requestInfo)
        resolve(body)
      })
    })
  }

  instance.consumerToken = function (login_data) {
    return apiCall({
      url: createUrl('/integration/customer/token'),
      method: 'POST',
      body: login_data
    })
  }

  instance.get = function (resourceUrl, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'GET'
    }
    return apiCall(request_data, request_token)
  }

  instance.post = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'POST',
      body: data
    }
    return apiCall(request_data, request_token)
  }

  instance.put = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'PUT',
      body: data
    }
    return apiCall(request_data, request_token)
  }

  instance.delete = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'DELETE',
      body: data
    }
    return apiCall(request_data, request_token)
  }

  return instance
}
