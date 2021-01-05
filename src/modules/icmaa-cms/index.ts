import { Router } from 'express'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'
import routes from './api'

module.exports = ({ config, db }: ExtensionAPIFunctionParameter): Router => {
  const api = routes({ config, db })
  return api
}
