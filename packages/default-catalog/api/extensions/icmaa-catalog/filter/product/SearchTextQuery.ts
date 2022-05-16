import { omit } from 'lodash'
import { FilterInterface } from 'storefront-query-builder'
import getFunctionScores from 'storefront-query-builder/lib/elasticsearch/score'

const getMultimatchQuery = (queryChain: any, fields: any[], multiMatchConfig: any, query: string, parents = []): any => {
  fields.forEach(field => {
    if (field.nested !== undefined) {
      parents.push(field.nested)
      const path = parents.join('.')
      queryChain.orQuery('nested', { path }, nestedQueryChain =>
        getMultimatchQuery(nestedQueryChain, field.fields, multiMatchConfig, query, parents)
      )
    } else {
      const mappedParentFields = field.fields.map(f => parents.length > 0 ? parents.join('.') + `.${f}` : f)
      if (field.operator === 'and') {
        queryChain.orQuery('multi_match', 'fields', mappedParentFields, { ...multiMatchConfig, ...omit(field, 'fields'), query })
      } else {
        const words = query.split(' ').filter(Boolean) // Filter emtpy strings by multiple whitespaces
        if (words.length > 1) {
          // If more than one word, put it in sub-bool-query to force all words to be necessary
          queryChain.orQuery('bool', subQuery => {
            words.forEach(word => {
              subQuery.query('multi_match', 'fields', mappedParentFields, { ...multiMatchConfig, ...omit(field, 'fields'), query: word })
            })
            return subQuery
          })
        } else {
          queryChain.orQuery('multi_match', 'fields', mappedParentFields, { ...multiMatchConfig, ...omit(field, 'fields'), query })
        }
      }
    }
  })

  return queryChain
}

/**
 * This is a modified copy of the `applyTextQuery()` method in `storefront-query-builder/src/elasticsearch/body.ts`.
 * We added support for mutlimatch the nested category property and refactored the config. See `README.md` for more info.
 */
const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => ['search-text', 'search-text-plain'].includes(attribute),
  mutator: (value) => Object.values(value)[0][0].trim(),
  filter ({ queryChain, value, attribute }) {
    if (value === '' || !value) {
      return queryChain
    }

    let newQueryChain = this.bodybuilder()

    const searchableAttributes: any[] = this.config.elasticsearch?.icmaaSearchableAttributes || [{ fields: 'name^1' }]
    const multiMatchConfig = this.config.elasticsearch.multimatchConfig
    newQueryChain = getMultimatchQuery(newQueryChain, searchableAttributes, multiMatchConfig, value)
    newQueryChain.queryMinimumShouldMatch(1, true)

    newQueryChain.orQuery('multi_match', 'fields', ['_id', 'sku'], { type: 'phrase', query: value, boost: 10 })

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
        return b.agg('terms', 'category.id', options, 'categories', c => {
          return c.agg('max', { script: '_score' }, 'max_score')
            .agg('top_hits', { _source: ['category.name', 'category.id', 'category.search_alias'], size: 1 }, 'hits')
        })
      })
    }

    return this.queryChain
  }
}

export default filter
