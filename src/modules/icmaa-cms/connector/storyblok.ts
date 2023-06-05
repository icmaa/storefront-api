/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import config from 'config'

import qs from 'qs'
import fetch from 'isomorphic-fetch'
import cache from '@storefront-api/lib/cache-instance'

import { objectKeysToCamelCase } from '../helpers/formatter'
import { extractStoryContent, extractPluginValues } from '../helpers/formatter/storyblok'
import type { StoryblokStory, StoryblokStoryContent } from '../helpers/formatter/storyblok'

import sortBy from 'lodash/sortBy'
import pick from 'lodash/pick'
import merge from 'lodash/merge'
import camelCase from 'lodash/camelCase'

interface CreateAttributeOptionArrayParams {
  options: any[],
  nameKey?: string | ((option: string|any) => any),
  valueKey?: string,
  sortKey?: string
}

type UniversalParams = {
  type: string,
  lang: string,
  cv?: string,
  additional?: string
}

type FetchParams = UniversalParams & {
  uid: string,
  key?: string
}

type SearchParams = UniversalParams & {
  fields: string,
  q: string,
  page: string | number,
  size: string | number,
  sort: string
}

type SearchRequestParams<T = unknown> = {
  queryObject: Record<string, any>,
  type: string,
  results?: T[],
  fields?: string,
  page?: number,
  size?: number,
  sort?: string,
  cv?: string,
  additional?: AdditionalDTO
}

type Additional = {
  resolve_relations?: string
}

type RawAdditionalParam = {
  [Property in keyof Additional]?: string[];
}

type AdditionalDTO = {
  data: Additional,
  raw: RawAdditionalParam
}

interface StoryblokStoryResponse<
  S = StoryblokStory,
  R = StoryblokStory,
  L = Record<string, unknown>
> {
  stories: S[],
  cv?: number,
  rels: R[],
  links: L[]
}

interface StoryblokDatasourceResponse<S = Record<string, unknown>> {
  datasource_entries: S[],
  cv?: number
}

class StoryblokConnector {
  protected lang: string|boolean
  protected release: string
  protected loadAllItems: boolean

  public api () {
    return {
      get: async <T = StoryblokStoryResponse>(endpoint = 'cdn/stories', params: Record<string, any> = {}, cv?: string): Promise<T> => {
        const baseUrl = 'https://api.storyblok.com/v2'
        const defaults = {
          token: config.get('extensions.icmaaCms.storyblok.accessToken'),
          // Storyblok needs a cache-version or will alwys serve uncached versions which leads to hit the limit quickly.
          // @see https://www.storyblok.com/docs/api/content-delivery#topics/cache-invalidation
          cv: await this.api().cv(cv)
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
            const data: any = await response.json()
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
      cv: async function (cv?: string): Promise<string> {
        if (cv === 'justnow') {
          return undefined
        }

        const cacheKey = 'storyblokCacheVersion'
        if (!config.get('server.useOutputCache') || !cache || !cache.get) {
          return Date.now().toString()
        }

        return cache.get(cacheKey).then(output => {
          if (!cv && output !== null) {
            return output.toString()
          }
          return this
            .get('cdn/spaces/me', {}, 'justnow')
            .then(resp => {
              const cv = resp.space.version.toString()
              return cache
                .set(cacheKey, cv, ['cms', 'cms-cacheversion'])
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

  public async fetch ({ type, uid, lang, key, cv, additional: additionalData }: FetchParams) {
    let request: Promise<any>
    const fetchById = (key && key === 'id')
    const fetchByUuid = (key && key === 'uuid')

    this.matchLanguage(lang)
    const additional = this.parseAdditionalData(additionalData, type)

    if (fetchById) {
      request = this.api().get(
        `cdn/stories/${uid}`,
        { language: this.lang ? this.lang : undefined, ...additional?.data || {} },
        cv
      )
    } else if (fetchByUuid) {
      request = this.api().get(
        'cdn/stories',
        { by_uuids: uid, language: this.lang ? this.lang : undefined, ...additional?.data || {} },
        cv
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
        filter_query: {
          component: { in: type },
          ...query
        },
        ...additional?.data || {}
      }, cv)
    }

    return request
      .then(async response => {
        const story = fetchById
          ? response.story || {}
          : response.stories.shift() || {}

        const content = await this.transformStories(
          [story],
          response.rels,
          additional
        )
        return content.shift()
      }).catch(e => {
        console.error('Error during parsing:', e)
        return { }
      })
  }

  public async search ({ type, q, lang, fields, page, size, sort, cv, additional: additionalData }: SearchParams) {
    this.matchLanguage(lang)

    const additional = this.parseAdditionalData(additionalData, type)

    let queryObject: any = { identifier: { in: q } }
    const jsonQuery: any = this.isJsonString(q)
    if (jsonQuery) {
      queryObject = jsonQuery

      if (queryObject?.uuid) {
        return this.api().get(
          'cdn/stories',
          { by_uuids: queryObject.uuid, language: this.lang ? this.lang : undefined, ...additional?.data || {} },
          cv
        ).then(response => {
          return this.transformStories(
            response.stories,
            response.rels,
            additional
          )
        })
      }
    }

    if (sort) sort = `content.${sort}`
    if (page && typeof page === 'string') page = parseInt(page) as number
    if (size && typeof size === 'string') size = parseInt(size)
    page = page as number
    size = size as number

    return this.searchRequest({ queryObject, type, fields, page, size, sort, cv, additional })
  }

  /**
   * Return a query-based search against Storyblok.
   *
   * If you add no page it will load all items in 25 items/step (thats the default Storyblok limit).
   * If you add a size and a page it will return the specific page limited by the size.
   * If you only add a size it will load the the first page with the entered size.
   */
  public async searchRequest ({ queryObject, type, results = [], fields, page, size, sort, cv, additional }: SearchRequestParams) {
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
      filter_query: {
        component: { in: type },
        ...queryObject
      },
      ...sort_by,
      ...additional?.data || {}
    }, cv).then(async response => {
      let stories = await this.transformStories(
        response.stories,
        response.rels,
        additional
      )

      if (fields?.length > 0) {
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

      return this.searchRequest({ queryObject, type, results, fields, page: page + 1, size, sort, cv, additional })
    }).catch(e => {
      console.error('Error during parsing:', e)
      return []
    })
  }

  protected async transformStories<T extends StoryblokStoryContent> (payload: StoryblokStory<T>[], relations?: StoryblokStory<T>[], additional?: AdditionalDTO): Promise<Partial<T>[]> {
    let extractedPayload = payload
      .map(story => extractStoryContent<T>(story))
      .map(story => objectKeysToCamelCase(story as T))

    extractedPayload = await Promise.all(
      extractedPayload.map(story => extractPluginValues<T>(story))
    ).catch(e => {
      console.error('Error during plugin value mapping:', e)
      return extractedPayload
    })

    if (relations && additional?.data?.resolve_relations) {
      const rels = await this.transformStories(relations)
      additional.raw.resolve_relations
        .map(camelCase)
        .forEach(key => {
          extractedPayload = extractedPayload.map(story => {
            if (story[key]) {
              if (Array.isArray(story[key])) {
                story[key] = story[key].map(uuid => {
                  const rel = rels.find(r => r.uuid === uuid)
                  return rel || uuid
                })
              } else {
                const rel = rels.find(r => r.uuid === story[key])
                if (rel) story[key] = rel
              }
            }
            return story
          })
        })
    }

    return extractedPayload
  }

  protected parseAdditionalData (payload: string, type: string): AdditionalDTO {
    let raw = {}
    let data: Additional = {}

    if (payload) {
      raw = JSON.parse(payload)
      data = Object.assign({}, raw)
      if (data.resolve_relations && Array.isArray(data.resolve_relations)) {
        data.resolve_relations = data.resolve_relations.map(r => `${type}.${r}`).join(',')
      }
    }

    return { data, raw }
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
      return this.api().get<StoryblokDatasourceResponse>('cdn/datasource_entries', {
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

export default StoryblokConnector
