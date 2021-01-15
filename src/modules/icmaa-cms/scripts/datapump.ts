import program from 'commander'
import storyblokConnector from 'icmaa-cms/connector/storyblok'
import { getClient } from '@storefront-api/lib/elastic'

program
  .command('import <type>')
  .description('Import a specific type of data from Storyblok into ElasticSearch')
  .option('-l, --language [lang]', 'Language for the import', 'de')
  .option('-r, --release [release]', 'Storyblok release-id to use for import')
  .action(async (type, options) => {
    const teaser = await storyblokConnector
      .setRelease(options.release)
      .search({
        type,
        q: {},
        lang: options.language,
        fields: undefined,
        page: undefined,
        size: 5,
        sort: undefined
      }).then(resp => resp)
  })

program.parse(process.argv)
