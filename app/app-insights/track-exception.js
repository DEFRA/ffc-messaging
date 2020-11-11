module.exports = (appInsights, message) => {
  if (appInsights && appInsights.defaultClient) {
    appInsights.defaultClient.trackException({ message })
  }
}
