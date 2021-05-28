import config from 'config'
import { RequestHandler } from 'express'
import loadCustomFilters from '@storefront-api/default-catalog/helper/loadCustomFilters'

const router: RequestHandler = async (req, res) => {
  /**
   * Load the custom-filters because this takes some time, the first time.
   * Otherwise this might cause random delays in API request each time a new node is started.
   */
  await loadCustomFilters(config)
  await loadCustomFilters(config, 'product')

  res.send('Warm-Up for storefront-api done')
}

export default router
