import { Server } from '@storefront-api/core'
import modules from './modules'

// Add custom datadog tracer
import 'icmaa-monitoring/datadog/dd-trace'

const server = new Server({
  modules
})

server.start()

export default server
