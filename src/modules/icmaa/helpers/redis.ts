import { IConfig } from 'config'
import TagCache from 'redis-tag-cache'
import Redis from 'ioredis'

export default (config: IConfig, keyPrefix = 'default'): TagCache => {
  const redisConfig = config.get<Record<string, any>>('redis')
  if (redisConfig.auth) {
    redisConfig.password = redisConfig.auth
  }

  return new TagCache({
    defaultTimeout: 86400,
    redis: { keyPrefix, ...redisConfig }
  })
}

export const ioRedis = (config: IConfig): Redis.Redis => {
  const redisConfig = config.get<Record<string, any>>('redis')
  if (redisConfig.auth) {
    redisConfig.password = redisConfig.auth
  }

  return new Redis(redisConfig)
}
