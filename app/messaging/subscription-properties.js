const AdministrationBase = require('./administration-base')

class SubscriptionProperties extends AdministrationBase {
  async getSubscriptionDetails (topicName, subscriptionName) {
    const subscriptionProperties = await this.sbAdministrationClient.getSubscriptionRuntimeProperties(topicName, subscriptionName)
    return { activeMessageCount: subscriptionProperties.activeMessageCount, deadLetterMessageCount: subscriptionProperties.deadLetterMessageCount }
  }
}

module.exports = SubscriptionProperties
