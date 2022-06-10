const MessageBase = require('./message-base')
const messageSchema = require('./message-schema')
const retry = require('../retry')
const { trackTrace } = require('../app-insights')

class MessageSender extends MessageBase {
  constructor (config) {
    super(config)
    this.sendMessage = this.sendMessage.bind(this)
    this.sender = this.sbClient.createSender(config.address)
  }

  async sendMessage (message, options = {}) {
    await messageSchema.validateAsync(message, { allowUnknown: true })
    message = this.enrichMessage(message)
    trackTrace(this.appInsights, this.connectionName)
    await retry(() => this.send(message, options), this.config.retries, this.config.retryWaitInMs, this.config.exponentialRetry)
    return message
  }

  async send (message, options) {
    await this.sender.sendMessages(message, options)
  }

  async closeConnection () {
    await this.sender.close()
    await super.closeConnection()
  }

  enrichMessage (message) {
    return {
      ...message,
      applicationProperties: {
        type: message.type,
        source: message.source,
        ...message.applicationProperties
      }
    }
  }
}

module.exports = MessageSender
