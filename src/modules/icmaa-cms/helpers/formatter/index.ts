import camelCase from 'lodash/camelCase'

export const objectKeysToCamelCase = <T>(object: T): Partial<T> => {
  for (const key in object) {
    const ccKey = camelCase(key)
    if (ccKey !== key) {
      object[ccKey] = object[key]
      delete object[key]
    }
  }

  return object
}
