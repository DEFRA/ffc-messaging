const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

class MessageBase {
  constructor (config) {
    this.connectionName = config.name || config.address
    this.appInsights = config.appInsights
    this.config = config
    this.connect()
  }

  connect () {
    if (this.config.useCredentialChain) {
      const credentials = this.getCredentials()
      this.sbClient = new ServiceBusClient(this.config.host, credentials)
    } else if (this.config.connectionString) {
      this.sbClient = new ServiceBusClient(this.config.connectionString)
    } else {
      this.sbClient = new ServiceBusClient(`Endpoint=sb://${this.config.host}/;SharedAccessKeyName=${this.config.username};SharedAccessKey=${this.config.password}`)
    }
  }

  getCredentials () {
    return new DefaultAzureCredential()
  }

  async closeConnection () {
    await this.sbClient.close()
  }
}

module.exports = MessageBase
