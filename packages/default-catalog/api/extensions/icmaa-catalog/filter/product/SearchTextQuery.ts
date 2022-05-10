import { forEach } from 'lodash'
import { FilterInterface } from 'storefront-query-builder'
import getFunctionScores from 'storefront-query-builder/lib/elasticsearch/score'

interface MultiMatchItem {
  operator: 'or'|'and',
  [key: string]: { boost: number } | MultiMatchItem | any
}

const getMultimatchQuery = (queryChain: any, fields: MultiMatchItem, multiMatchConfig: any, query: string, nestedPath?: string): any => {
  nestedPath = nestedPath ? nestedPath + '.' : ''
  const orFields = []
  const andFields = []

  forEach(fields, (field, path) => {
    if (field.boost !== undefined) {
      const fieldName = nestedPath + path + '^' + field.boost

      if (field.operator === 'and') {
        andFields.push(fieldName)
      } else {
        orFields.push(fieldName)
      }
    } else {
      queryChain.orQuery('nested', { path: nestedPath + path }, nestedQueryChain =>
        getMultimatchQuery(nestedQueryChain, field, multiMatchConfig, query, nestedPath + path)
      )
    }
  })

  query.split(' ').forEach(word => {
    if (orFields.length > 0) {
      queryChain.orQuery('multi_match', 'fields', orFields, { ...multiMatchConfig, query: word })
    }
  })

  if (andFields.length > 0) {
    queryChain.orQuery('multi_match', 'fields', andFields, Object.assign(multiMatchConfig, { query, operator: 'and' }))
  }

  return queryChain
}

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => ['search-text', 'search-text-plain'].includes(attribute),
  filter ({ queryChain, value, attribute }) {
    /**
     * This is a modified copy of the `applyTextQuery()` method in `storefront-query-builder/src/elasticsearch/body.ts`.
     * We added support for mutlimatch the nested category property. See `README.md` for more info.
     */

    if (value === '' || !value) {
      return queryChain
    }

    let newQueryChain = this.bodybuilder()

    const searchableAttributes: MultiMatchItem = this.config.elasticsearch?.searchableAttributes || { name: { boost: 1 } }
    const multiMatchConfig = this.config.elasticsearch.multimatchConfig
    newQueryChain = getMultimatchQuery(newQueryChain, searchableAttributes, multiMatchConfig, value)
    newQueryChain.orQuery('match_phrase', 'sku', { query: value, boost: 2 })
    newQueryChain.queryMinimumShouldMatch(1, true)

    const functionScore = getFunctionScores(this.config)
    if (functionScore) {
      this.queryChain.query('function_score', functionScore, () => newQueryChain)
    } else {
      this.queryChain = newQueryChain
    }

    // Add category-aggregation using `nested` and `top-hits` to get all possible categories in results for category filter
    // And sort them by their max score first and then by documents found with this category
    if (!attribute.endsWith('plain')) {
      this.queryChain.agg('nested', { path: 'category' }, 'categories_found', b => {
        const options = { size: 50, order: [{ max_score: 'desc' }, { _count: 'desc' }] }
        return b.agg('terms', 'category.category_id', options, 'categories', c => {
          return c.agg('max', { script: '_score' }, 'max_score')
            .agg('top_hits', { _source: ['category.name', 'category.category_id', 'category.position'], size: 1 }, 'hits')
        })
      })
    }

    return this.queryChain
  },
  mutator: (value) => Object.values(value)[0][0]
}

export default filter
