const { ServiceBusClient } = require('@azure/service-bus')
const auth = require('@azure/ms-rest-nodeauth')

class MessageBase {
  constructor (config) {
    this.connectionName = config.name
    this.appInsights = config.appInsights
    this.config = config
  }

  async connect () {
    if (this.config.usePodIdentity) {
      const credentials = await auth.loginWithVmMSI({ resource: 'https://servicebus.azure.net' })
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
