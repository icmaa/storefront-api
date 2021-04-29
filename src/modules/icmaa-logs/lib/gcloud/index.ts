/**
 * Add gcloud trace-agent, debugger and profiler – see `icmaa-logs` module
 */
if (
  process.env.NODE_ENV === 'production' &&
  !!process.env.GCLOUD_OPERATIONS_ENABLED
) {
  require('@google-cloud/trace-agent').start()
  require('@google-cloud/profiler').start()
  require('@google-cloud/debug-agent').start({
    appPathRelativeToRepository: '../../',
    javascriptFileExtensions: ['.js', '.ts']
  })

  console.log('Enable Google Cloud Operations libraries')
}
