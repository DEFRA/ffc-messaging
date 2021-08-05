const MessageBase = require('./message-base')
const messageSchema = require('./message-schema')
const retry = require('../retry')
const { trackTrace } = require('../app-insights')

class MessageBatchSender extends MessageBase {
  constructor (config) {
    super(config)
    this.sendBatchMessages = this.sendBatchMessages.bind(this)
    this.sender = this.sbClient.createSender(config.address)
  }

  async sendBatchMessages (messages, options = {}) {
    let batch = await this.sender.createMessageBatch()

    for (const message of messages) {
      await messageSchema.validateAsync(message, { allowUnknown: true })
      const enrichMessage = this.enrichMessage(message)
      trackTrace(this.appInsights, this.connectionName)

      if (!batch.tryAddMessage(enrichMessage)) {
        await retry(() => this.send(batch, options), this.config.retries, this.config.retryWaitInMs, this.config.exponentialRetry)
        batch = await this.sender.createMessageBatch()

        if (!batch.tryAddMessage(enrichMessage)) {
          throw new Error('Message too big to fit in a batch!')
        }
      }
    }

    await retry(() => this.send(batch, options), this.config.retries, this.config.retryWaitInMs, this.config.exponentialRetry)
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
        source: message.source
      }
    }
  }
}

module.exports = MessageBatchSender
