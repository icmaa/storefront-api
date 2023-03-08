import { RequestHandler } from 'express'

const router: RequestHandler = async (req, res) => {
  res.send('Warm-Up for storefront-api done')
}

export default router
