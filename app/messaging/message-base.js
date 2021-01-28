const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

class MessageBase {
  constructor (config) {
    this.connectionName = config.name
    this.appInsights = config.appInsights
    this.config = config
    if (config.useCredentialChain) {
      const credentials = new DefaultAzureCredential()
      this.sbClient = new ServiceBusClient(this.config.host, credentials)
    } else {
      this.sbClient = new ServiceBusClient(`Endpoint=sb://${this.config.host}/;SharedAccessKeyName=${this.config.username};SharedAccessKey=${this.config.password}`)
    }
  }

  async closeConnection () {
    await this.sbClient.close()
  }
}

module.exports = MessageBase
