import program from 'commander'
import path from 'path'
import { flatten, chunk } from 'lodash'

import config from 'config'
import storyblokConnector from 'icmaa-cms/connector/storyblok'
import Logger from '@storefront-api/lib/logger'
import * as es from '@storefront-api/lib/elastic'
import { getCurrentStoreView } from '@storefront-api/lib/util'

const db = es.getClient(config)

const fetchItemsFromStoryblok = ({ type, lang, release }): Promise<any[]> => {
  return storyblokConnector
    .setRelease(release)
    .search({ type, q: {}, lang, fields: undefined, page: undefined, size: undefined, sort: undefined })
    .then(resp => resp)
}

program
  .command('import <type>')
  .description('Import a specific type of data from Storyblok into ElasticSearch')
  .option('-l, --language [lang]', 'Language for the import', 'de')
  .option('-r, --release [release]', 'Storyblok release-id to use for import')
  .action(async (type, options) => {
    const { language: lang, release } = options

    const timestamp = Math.round(+new Date() / 1000)
    const storeViewConfig = getCurrentStoreView(lang)
    const indexName = storeViewConfig.elasticsearch.index

    const originalIndex = indexName + '_' + type
    const tempIndex = originalIndex + '_' + timestamp
    const indexSchema = es.loadSchema(
      path.join(__dirname, '../elasticsearch'),
      type,
      config.get('elasticsearch.apiVersion')
    )

    Logger.info(`** Create temporary index: ${tempIndex}`)
    await db.indices.create({
      index: tempIndex,
      body: indexSchema
    }).then(() => Logger.info('   Done'))

    Logger.info(`** Load all "${type}" items from Storyblok for "${lang}" `)
    const items = await fetchItemsFromStoryblok({ type, lang, release })
    Logger.info(`   Found ${items.length} items`)

    Logger.info('** Write items into temporary index')
    chunk(items, 100).forEach((chunk, i) => {
      Logger.info(`  Write chunk #${i + 1}`)
      const body = flatten(chunk.map(doc => [{ index: { _index: tempIndex } }, doc]))
      db.bulk({ body })
        .then(() => {
          Logger.info('   Done')
        })
        .catch(e => {
          Logger.info('   Error: ' + e.message)
          return 1
        })
    })
  })

program.parse(process.argv)
