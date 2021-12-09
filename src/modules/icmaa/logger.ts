import morgan from 'morgan'
import { Express } from 'express'

export default function registerLogging (express: Express): void {
  // GAE metrics
  morgan.token('gae-instance-id', () => process.env.GAE_INSTANCE || '-')
  morgan.token('gae-version', () => process.env.GAE_VERSION || '-')
  morgan.token('gae-severity', (req, res) => res.statusCode < 400 ? 'INFO' : 'ERROR')

  // API metrics
  morgan.token('cache', (req, res) => res.getHeader('x-vs-cache') || 'cache-none')
  morgan.token('body', (req, res) => (res.statusCode >= 400 || req.method === 'POST') ? req.body : '')

  if (process.env.GCLOUD_OPERATIONS_ENABLED) {
    // GAE structured-data output
    const morganStream = morgan((tokens, req, res) => {
      const payload = {
        severity: tokens.gaeSeverity(req, res),
        status: tokens.status(req, res),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        body: tokens.body(req, res),
        contentLength: tokens.res(req, res, 'content-length'),
        responseTime: tokens['response-time'](req, res) + 'ms',
        cache: tokens.cache(req, res),
        instanceId: tokens.gaeInstanceId(req, res),
        version: tokens.gaeVersion(req, res)
      }

      return JSON.stringify(payload)
    })

    express.use(morganStream)
  } else {
    // Default output
    express.use(morgan(':method :url :status :res[content-length] :vs-cache :gae-instance-id - :response-time ms'))
  }
}
