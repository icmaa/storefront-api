import config from 'config'

import qs from 'qs'
import fetch from 'node-fetch'
import cache from '@storefront-api/lib/cache-instance'

import { objectKeysToCamelCase } from '../helpers/formatter'
import { extractStoryContent, extractPluginValues } from '../helpers/formatter/storyblok'
import { sortBy, pick, merge } from 'lodash'

interface CreateAttributeOptionArrayParams {
  options: any[],
  nameKey?: string | ((option: string|any) => any),
  valueKey?: string,
  sortKey?: string
}

class StoryblokConnector {
  protected lang: string|boolean
  protected release: string
  protected loadAllItems: boolean

  public api () {
    return {
      get: async (endpoint = 'cdn/stories', params: Record<string, any> = {}, cv?: string): Promise<any> => {
        const baseUrl = 'https://api.storyblok.com/v1'
        const defaults = {
          token: config.get('extensions.icmaaCms.storyblok.accessToken'),
          // Storyblok needs a cache-version or will alwys serve uncached versions which leads to hit the limit quickly.
          // @see https://www.storyblok.com/docs/api/content-delivery#topics/cache-invalidation
          cv: cv || await this.api().cv()
        }

        if (config.has('extensions.icmaaCms.storyblok.version')) {
          const version = config.get<'published'|'draft'>('extensions.icmaaCms.storyblok.version')
          if (version) {
            merge(defaults, { version })
          }
        }

        if (this.release) {
          merge(defaults, { from_release: this.release })
        }

        const querystring: string = '?' + qs.stringify(
          merge(defaults, params),
          { encodeValuesOnly: true, arrayFormat: 'brackets' }
        )

        return fetch(`${baseUrl}/${endpoint}${querystring}`)
          .then(async (response) => {
            const data = await response.json()
            if (response.status !== 401) {
              return data
            }
            throw Error(data.error)
          })
          .catch(error => {
            console.error('Error during storyblok fetch:', error)
            return {}
          })
      },
      cv: async (): Promise<string> => {
        const cacheKey = 'storyblokCacheVersion'
        if (!config.get('server.useOutputCache') || !cache || !cache.get) {
          return Date.now().toString()
        }

        return cache.get(cacheKey).then(output => {
          if (output !== null) {
            return output.toString()
          }
          return this.api()
            .get('cdn/spaces/me', {}, 'justnow')
            .then(resp => {
              const cv = resp.space.version.toString()
              return cache.set(cacheKey, cv, ['cms', 'cms-cacheversion'])
                .then(() => cv)
            })
        }).catch(e => {
          console.error('Error during storyblok CV fetch:', e)
          return Date.now().toString()
        })
      }
    }
  }

  public matchLanguage (lang) {
    const defaultLanguageCodes: string[] = config.get('extensions.icmaaCms.storyblok.defaultLanguageCodes')
    lang = lang && !defaultLanguageCodes.includes(lang) ? lang.toLowerCase() : false
    this.lang = lang && config.get('icmaa.mandant') ? `${config.get('icmaa.mandant')}_${lang}` : lang
    return this.lang
  }

  public setRelease (release?: string) {
    this.release = release
    return this
  }

  public isJsonString (string) {
    try {
      const query = JSON.parse(string)
      for (const key in query) {
        if (key.startsWith('i18n_')) {
          query.__or = [
            { [this.getKey(key)]: query[key] },
            { [key.slice(5)]: query[key] }
          ]

          delete query[key]
        }
      }

      return query
    } catch (e) {
      return false
    }
  }

  public getKey (key = 'identifier'): string {
    return (key.startsWith('i18n_')) ? key.slice(5) + '__i18n__' + this.lang : key
  }

  public async fetch ({ type, uid, lang, key }) {
    let request: Promise<any>
    const fetchById = (key && key === 'id')
    const fetchByUuid = (key && key === 'uuid')

    this.matchLanguage(lang)

    if (fetchById) {
      request = this.api().get(
        `cdn/stories/${uid}`,
        { language: this.lang ? this.lang : undefined }
      )
    } else if (fetchByUuid) {
      request = this.api().get(
        'cdn/stories',
        { by_uuids: uid, language: this.lang ? this.lang : undefined }
      )
    } else {
      let query: any = { [this.getKey(key)]: { in: uid } }
      if (key && key.startsWith('i18n_')) {
        query = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __or: [
            { [this.getKey(key)]: { in: uid } },
            { [key.slice(5)]: { in: uid } }
          ]
        }
      }

      request = this.api().get('cdn/stories', {
        starts_with: this.lang ? `${this.lang}/*` : '',
        filter_query_v2: {
          component: { in: type },
          ...query
        }
      })
    }

    return request
      .then(async response => {
        const story = fetchById
          ? response.story || {}
          : response.stories.shift() || {}
        const content = extractStoryContent(story)
        objectKeysToCamelCase(content)
        await extractPluginValues(content).catch(e => {
          console.error('Error during plugin value mapping:', e)
        })
        return content
      }).catch(e => {
        console.error('Error during parsing:', e)
        return { }
      })
  }

  public async search ({ type, q, lang, fields, page, size, sort }) {
    this.matchLanguage(lang)

    let queryObject: any = { identifier: { in: q } }
    const jsonQuery: any = this.isJsonString(q)
    if (jsonQuery) {
      queryObject = jsonQuery
    }

    if (page) page = parseInt(page)
    if (size) size = parseInt(size)
    if (sort) sort = `content.${sort}`

    return this.searchRequest({ queryObject, type, fields, page, size, sort })
  }

  /**
   * Return a query-based search against Storyblok.
   *
   * If you add no page it will load all items in 25 items/step (thats the default Storyblok limit).
   * If you add a size and a page it will return the specific page limited by the size.
   * If you only add a size it will load the the first page with the entered size.
   */
  public async searchRequest ({ queryObject, type, results = [], fields, page, size, sort }) {
    const sort_by = sort ? { sort_by: sort } : {}

    if (!page) {
      this.loadAllItems = (!size)
      page = 1
    }

    if (!size) {
      size = 25
    }

    return this.api().get('cdn/stories', {
      page,
      per_page: size,
      starts_with: this.lang ? `${this.lang}/*` : '',
      filter_query_v2: {
        component: { in: type },
        ...queryObject
      },
      ...sort_by
    }).then(async response => {
      let stories = response.stories
        .map(story => extractStoryContent(story))
        .map(story => objectKeysToCamelCase(story))

      stories = await Promise.all(
        stories.map(story => extractPluginValues(story))
      ).catch(e => {
        console.error('Error during plugin value mapping:', e)
      })

      if (fields && fields.length > 0) {
        stories = stories.map(story => pick(story, fields.split(',')))
      }

      results = [].concat(results, stories)
      if (stories.length < size && this.loadAllItems) {
        return results
      } else if (!this.loadAllItems) {
        if (results.length > size) {
          results.splice(size)
        }
        return results
      }

      return this.searchRequest({ queryObject, type, results, fields, page: page + 1, size, sort })
    }).catch(e => {
      console.error('Error during parsing:', e)
      return []
    })
  }

  public createAttributeOptionArray ({ options, nameKey = 'label', valueKey = 'value', sortKey = 'sort_order' }: CreateAttributeOptionArrayParams) {
    let result = []
    options.forEach(option => {
      result.push({
        name: typeof nameKey === 'function' ? nameKey(option) : option[nameKey],
        value: option[valueKey],
        sort_order: option[sortKey] || 1
      })
    })

    result = sortBy(result, ['sort_order', 'name'])

    return result
  }

  public async datasource ({ code, page = 1 }) {
    try {
      return this.api().get('cdn/datasource_entries', {
        datasource: code,
        page: page,
        per_page: 1000
      }).then(response => {
        return response.datasource_entries.map(e => ({ value: e.value, label: e.name }))
      }).catch(() => {
        return []
      })
    } catch (error) {
      return error
    }
  }
}

export default new StoryblokConnector()
