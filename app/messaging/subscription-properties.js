const AdministrationBase = require('./administration-base')

class SubscriptionProperties extends AdministrationBase {
  constructor (config) {
    super(config)
    this.subscriptionDetails = this.subscriptionDetails.bind(this)
  }

  async subscriptionDetails (topicName, subscriptionName) {
    const subscriptionProperties = await this.sbAdministrationClient.getSubscriptionRuntimeProperties(topicName, subscriptionName)
    return { activeMessageCount: subscriptionProperties.activeMessageCount, deadLetterMessageCount: subscriptionProperties.deadLetterMessageCount }
  }

  async closeConnection () {
    await super.closeConnection()
  }
}

module.exports = SubscriptionProperties
