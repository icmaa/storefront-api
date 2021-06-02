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
    logger.debug('Calling API endpoint: ' + request_data.method + ' ' + request_data.url + ' token: ' + request_token);

    logger.info({
      url: request_data.url,
      method: request_data.method,
      headers: request_token ? { Authorization: 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
      json: true,
      body: request_data.body
    });
    /* eslint no-undef: off */
    return new Promise((resolve, reject) => {
      request({
        url: request_data.url,
        method: request_data.method,
        headers: request_token ? { Authorization: 'Bearer ' + request_token } : oauth.toHeader(oauth.authorize(request_data, token)),
        json: true,
        body: request_data.body
      }, (error, response, body) => {
        logger.debug('Response received')
        if (error) {
          logger.error('Error occured: ' + error);
          reject(error);
          return;
        } else if (!httpCallSucceeded(response)) {
          let errorMessage = ''

          if (body) {
            errorMessage = 'HTTP ERROR ' + body.code;
          } else {
            errorMessage = 'HTTP ERROR ' + response.code;
          }

          // eslint-disable-next-line no-prototype-builtins
          if (body && body.hasOwnProperty('result')) { errorMessage = errorString(body.result, body.hasOwnProperty('parameters') ? body.parameters : {}); }

          logger.error('API call failed: ' + errorMessage);
          reject(errorMessage);
        }
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
