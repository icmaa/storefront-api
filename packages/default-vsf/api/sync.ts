import { apiStatus } from '@storefront-api/lib/util';
import { Router } from 'express';

export default ({ config, db }) => {
  const syncApi = Router();

  /**
   * GET get stock item
   */
  syncApi.get('/order/:order_id', (req, res) => {
    const redisClient = db.getRedisClient(config)

    redisClient.get('order$$id$$' + req.param('order_id'), (err, reply) => {
      const orderMetaData = JSON.parse(reply)
      if (orderMetaData) {
        orderMetaData.order = null // for security reasons we're just clearing out the real order data as it's set by `order_2_magento2.js`
      }
      apiStatus(res, err || orderMetaData, err ? 500 : 200);
    })
  })

  return syncApi
}
