import config from 'config'
import { FilterInterface } from 'storefront-query-builder'
import moment from 'moment-timezone'
import omit from 'lodash/omit'

interface FilterDefaults { from: string, to: string, timezone?: string }
const defaultFields = config.get<FilterDefaults>('extensions.icmaa-catalog.defaultDateRangeFields')

const filter: FilterInterface = {
  priority: 1,
  check: ({ attribute }) => attribute === 'activeDateRange',
  filter ({ queryChain, value }) {
    // Empty values populated as `{ "in": "" }` – this would crash our query.
    if (Object.keys(value).length === 1 && value.in !== undefined) {
      value = {}
    }

    let dateTime = value.dateTime || 'now'
    const timezone = defaultFields.timezone || false
    const fromField = value.fromField || defaultFields.from
    const toField = value.toField || defaultFields.to

    // Get UTC offset or time using timezone.
    // We assume that times in the ES are always saved in UTC – if not we can set an offset
    // by the desired timezone or format the transmitted UTC date into the target timezone.
    if (timezone) {
      const isValidDateTime = moment(new Date(dateTime), moment.ISO_8601).isValid()
      if (dateTime === 'now') {
        const tzOffset = moment.tz(timezone).utcOffset() / 60
        dateTime = Math.sign(tzOffset) !== -1 ? `now+${tzOffset}h` : `now${tzOffset}h`
      } else if (isValidDateTime) {
        dateTime = isValidDateTime
          ? moment.tz(dateTime, timezone).format('yyyy-MM-DD HH:mm:ss')
          : moment.tz(timezone).format('yyyy-MM-DD HH:mm:ss')
      }
    }

    value = omit(value, ['dateTime', 'fromField', 'toField'])

    queryChain.filter('bool', rangeQuery => {
      rangeQuery
        // From
        .filter('bool', rangeFromQuery => {
          return rangeFromQuery
            .orFilter('bool', rangeFromEmptyQuery => {
              return rangeFromEmptyQuery.notFilter('exists', fromField)
            })
            .orFilter('range', fromField, {
              ...Object.assign({}, { lte: dateTime }, value)
            })
        })
        // To
        .filter('bool', rangeToQuery => {
          return rangeToQuery
            .orFilter('bool', rangeToEmptyQuery => {
              return rangeToEmptyQuery.notFilter('exists', toField)
            })
            .orFilter('range', toField, {
              ...Object.assign({}, { gte: dateTime }, value)
            })
        })

      return rangeQuery
    })

    return queryChain
  }
}

export default filter
