const { ServiceBusClient } = require('@azure/service-bus')
const auth = require('@azure/ms-rest-nodeauth')

class MessageBase {
  constructor (config) {
    this.connectionName = config.name
    this.appInsights = config.appInsights
    this.config = config
  }

  async connect () {
    const credentials = this.config.usePodIdentity ? await auth.loginWithVmMSI({ resource: 'https://servicebus.azure.net' }) : undefined
    this.sbClient = this.config.usePodIdentity ? await ServiceBusClient.createFromAadTokenCredentials(this.config.host, credentials) : ServiceBusClient.createFromConnectionString(`Endpoint=sb://${this.config.host}/;SharedAccessKeyName=${this.config.username};SharedAccessKey=${this.config.password}`)
    this.entityClient = this.createEntityClient(this.config)
  }

  createEntityClient (config) {
    switch (config.type) {
      case 'queue':
        return this.sbClient.createQueueClient(config.address)
      case 'topic':
        return this.sbClient.createTopicClient(config.address)
      case 'subscription':
        return this.sbClient.createSubscriptionClient(config.topic, config.address)
    }
  }

  async closeConnection () {
    await this.entityClient.close()
    await this.sbClient.close()
    console.log(`${this.connectionName} connection closed`)
  }
}

module.exports = MessageBase
