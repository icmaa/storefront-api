import { Router } from 'express'
import { apiStatus, apiError } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import PlatformFactory from '@storefront-api/platform/factory'
import AbstractUserProxy from '@storefront-api/platform-abstract/user'
import merge from 'lodash/merge'

import { newMagentoClientAction } from 'icmaa/helpers'
import GoogleRecaptcha from 'icmaa/helpers/googleRecaptcha'

const Ajv = require('ajv')
const fs = require('fs')
const path = require('path')

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const _getProxy = (req): AbstractUserProxy => {
    const platform = config.get<string>('platform')
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'user')
  }

  /**
   * This is a copy of the original /user/create action /w following changes:
   * * added Google Recaptcha check to request
   */
  api.post('/create', async (req, res) => {
    const recaptcha = await GoogleRecaptcha(req.body.customer?.recaptcha, config)
    if (recaptcha !== true) {
      apiStatus(res, recaptcha as string, 500)
      return
    }

    const ajv = new Ajv();
    const userRegisterSchema = require('@storefront-api/default-vsf/models/userRegister.schema.json')
    let userRegisterSchemaExtension = {};
    if (fs.existsSync(path.resolve(__dirname, '@storefront-api/default-vsf/models/userRegister.schema.extension.json'))) {
      userRegisterSchemaExtension = require('@storefront-api/default-vsf/models/userRegister.schema.extension.json')
    }

    const validate = ajv.compile(merge(userRegisterSchema, userRegisterSchemaExtension))
    if (!validate(req.body)) {
      apiStatus(res, validate.errors, 400);
      return
    }

    const userProxy = _getProxy(req)
    userProxy.register(req.body).then(result => {
      apiStatus(res, result, 200)
    }).catch(err => {
      apiError(res, err)
    })
  })

  api.get('/last-order', async (req, res) => {
    const client = newMagentoClientAction('order', 'last', 'order/', config, req)
    client.order.last(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
