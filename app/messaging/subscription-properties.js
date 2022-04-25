const AdministrationBase = require('./administration-base')

class SubscriptionProperties extends AdministrationBase {
  constructor (config) {
    super(config)
    this.getSubscriptionDetails = this.getSubscriptionDetails.bind(this)
  }

  async getSubscriptionDetails (topicName, subscriptionName) {
    const subscriptionProperties = await this.sbAdministrationClient.getSubscriptionRuntimeProperties(topicName, subscriptionName)
    return { activeMessageCount: subscriptionProperties.activeMessageCount, deadLetterMessageCount: subscriptionProperties.deadLetterMessageCount }
  }
}

module.exports = SubscriptionProperties
