const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

class MessageBase {
  constructor (config) {
    this.connectionName = config.name
    this.appInsights = config.appInsights
    this.config = config
    const credentials = new DefaultAzureCredential()
    this.sbClient = this.config.usePodIdentity ? new ServiceBusClient(this.config.host, credentials) : new ServiceBusClient(`Endpoint=sb://${this.config.host}/;SharedAccessKeyName=${this.config.username};SharedAccessKey=${this.config.password}`)
  }

  async closeConnection () {
    await this.sbClient.close()
    console.log(`${this.connectionName} connection closed`)
  }
}

module.exports = MessageBase
