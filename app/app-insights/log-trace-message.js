module.exports = (appInsights, message) => {
  if (appInsights && appInsights.defaultClient) {
    appInsights.defaultClient.trackTrace({ message })
  }
}
