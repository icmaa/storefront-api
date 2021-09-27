'use strict';

const OAuth = require('oauth-1.0a');
const request = require('request');
const logger = require('./log');

module.exports.RestClient = function (options) {
  const instance = {};

  var servelrUrl = options.url;
  var oauth = OAuth({
    consumer: {
      public: options.consumerKey,
      secret: options.consumerSecret
    },
    signature_method: 'HMAC-SHA1'
  });
  var token = {
    public: options.accessToken,
    secret: options.accessTokenSecret
  };

  function httpCallSucceeded (response) {
    return response.statusCode >= 200 && response.statusCode < 300;
  }

  function errorString (message, parameters) {
    if (parameters === null) {
      return message;
    }
    let parameterPlaceholder
    if (parameters instanceof Array) {
      for (let i = 0; i < parameters.length; i++) {
        parameterPlaceholder = '%' + (i + 1).toString();
        message = message.replace(parameterPlaceholder, parameters[i]);
      }
    } else if (parameters instanceof Object) {
      for (const key in parameters) {
        parameterPlaceholder = '%' + key;
        message = message.replace(parameterPlaceholder, parameters[key]);
      }
    }

    return message;
  }

  function createUrl (resourceUrl) {
    return servelrUrl + '/' + resourceUrl;
  }

  function apiCall (request_data, request_token = '') {
    const requestInfo = {
      url: request_data.url,
      method: request_data.method,
      headers: request_token ? { Authorization: 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
      json: true,
      body: request_data.body
    }

    logger.info('Calling API endpoint', requestInfo)

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
        headers: request_token ? { Authorization: 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
        json: true,
        body: request_data.body,
        jar
      }, (error, response, body) => {
        if (error) {
          logger.error('Error occured: ' + error)
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

          logger.error('API call failed with: ' + errorMessage, requestInfo)
          reject(errorMessage)

          return
        }

        logger.info('API response received', requestInfo)
        resolve(body);
      });
    });
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
    };
    return apiCall(request_data, request_token);
  }

  instance.post = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'POST',
      body: data
    };
    return apiCall(request_data, request_token);
  }

  instance.put = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'PUT',
      body: data
    };
    return apiCall(request_data, request_token);
  }

  instance.delete = function (resourceUrl, data, request_token = '') {
    const request_data = {
      url: createUrl(resourceUrl),
      method: 'DELETE',
      body: data
    };
    return apiCall(request_data, request_token);
  }

  return instance;
}
