import { Router } from 'express'
import { apiStatus } from '@storefront-api/lib/util'
import { ExtensionAPIFunctionParameter } from '@storefront-api/lib/module'

import NodeMailer from 'nodemailer'
import jwt from 'jwt-simple'

import GoogleRecaptcha from 'icmaa/helpers/googleRecaptcha'
import Redis from 'icmaa/helpers/redis'

module.exports = ({ config }: ExtensionAPIFunctionParameter): Router => {
  const api = Router()

  const tokenLimit = 5
  const getCurrentTimestamp = () => Math.floor(new Date().getTime() / 1000)

  api.get('/get-token', (req, res) => {
    const token = jwt.encode(getCurrentTimestamp(), config.get<string>('extensions.mailService.secretString'))
    apiStatus(res, token, 200)
  })

  api.post('/send-mail', async (req, res) => {
    const { name, recaptcha, ip } = req.body

    const recaptchaCheck = await GoogleRecaptcha(recaptcha, config)
    if (recaptchaCheck !== true) {
      apiStatus(res, recaptchaCheck as string, 500)
      return
    }

    if (ip) {
      const redisTagCache = Redis(config, `form-${name}`)
      if (await redisTagCache.get(ip)) {
        apiStatus(res, 'Your IP has already been used.', 500)
        redisTagCache.redis.quit()
        return
      }
      await redisTagCache.set(ip, true, [])
      redisTagCache.redis.quit()
    }

    const userData = req.body
    if (!userData.token) {
      apiStatus(res, 'Email is not authorized!', 500)
      return
    }

    const currentTime = getCurrentTimestamp()
    const tokenTime = jwt.decode(userData.token, config.get<string>('extensions.mailService.secretString'))
    if (currentTime - tokenTime > tokenLimit) {
      apiStatus(res, 'Token expired ', 500)
      return
    }

    const { host, port, secure, user, pass } = config.get<Record<string, any>>('extensions.mailService.transport')
    if (!host || !port || !user || !pass) {
      apiStatus(res, 'No transport is defined for mail service!', 500)
      return
    } else if (!userData.sourceAddress) {
      apiStatus(res, 'Source email address is not provided!', 500)
      return
    } else if (!userData.targetAddress) {
      apiStatus(res, 'Target email address is not provided!', 500)
      return
    }

    const whiteList = config.get<string[]>('extensions.mailService.targetAddressWhitelist')
    const email = userData.confirmation ? userData.sourceAddress : userData.targetAddress
    if (!whiteList.some(e => (email.startsWith(e) || email.endsWith(e) || email.endsWith(e + '>')))) {
      apiStatus(res, `Target email address (${email}) is not from the whitelist!`, 500)
      return
    }

    const auth = { user, pass }
    const transporter = NodeMailer.createTransport({ auth, host, port, secure })

    const { text, html, replyTo } = userData
    const mailOptions = {
      from: userData.sourceAddress,
      to: userData.targetAddress,
      subject: userData.subject,
      replyTo,
      text,
      html
    }

    transporter.sendMail(mailOptions, err => {
      if (err) {
        apiStatus(res, err, 500)
        return
      }

      transporter.close()

      apiStatus(res, 'OK', 200)
    })
  })

  return api
}
