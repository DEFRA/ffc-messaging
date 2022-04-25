const { ServiceBusAdministrationClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

class AdministrationBase {
  constructor (config) {
    this.connectionName = config.name || config.address
    this.appInsights = config.appInsights
    this.config = config
    this.connect()
  }

  connect () {
    if (this.config.useCredentialChain) {
      const credentials = this.getCredentials()
      this.sbAdministrationClient = new ServiceBusAdministrationClient(this.config.host, credentials)
    } else {
      this.sbAdministrationClient = new ServiceBusAdministrationClient(`Endpoint=sb://${this.config.host}/;SharedAccessKeyName=${this.config.username};SharedAccessKey=${this.config.password}`)
    }
  }

  getCredentials () {
    return new DefaultAzureCredential()
  }
}

module.exports = AdministrationBase
