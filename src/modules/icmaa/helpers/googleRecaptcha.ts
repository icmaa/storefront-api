import Axios from 'axios'
import { Response } from 'express'
import { IConfig } from 'config'

const qs = require('qs')

export default async (response: Response, config: IConfig): Promise<boolean|string> => {
  let recaptchaErrorMsg = 'Google reCAPTCHA is invalid'
  const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify'

  const secret = config.get('icmaa.googleRecaptcha.secretKey')
  const formData = qs.stringify({ secret, response })

  return Axios.post(recaptchaUrl, formData)
    .then(r => r && r.data.success && r.status === 200)
    .then(success => success || recaptchaErrorMsg)
    .catch(e => {
      recaptchaErrorMsg += ': ' + e.message
      return false
    })
}
