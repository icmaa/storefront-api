import program from 'commander'
import path from 'path'

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
    Logger.info('   Done')

    Logger.info('** Write items into temporary index')
    const body = items.map(doc => [{ index: { _index: 'vue_storefront_catalog_de_teaser_1610709457' } }, doc])
    db.bulk({ refresh: true, body })
      .then(resp => {
        Logger.info('   Result: ' + resp)
      })
      .catch(e => {
        Logger.info('   Error: ' + e.message)
        console.error(e)
      })
  })

program.parse(process.argv)
