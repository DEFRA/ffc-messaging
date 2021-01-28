const MessageBase = require('./message-base')
const messageSchema = require('./message-schema')
const { trackTrace } = require('../app-insights')

class MessageSender extends MessageBase {
  constructor (config) {
    config.name = `${config.address}-sender`
    super(config)
    this.sendMessage = this.sendMessage.bind(this)
  }

  async connect () {
    await super.connect()
    this.sender = this.sbClient.createSender(this.config.address)
  }

  async sendMessage (message, options = {}) {
    try {
      await messageSchema.validateAsync(message)
      message = this.enrichMessage(message)
      trackTrace(this.appInsights, this.connectionName)
      await this.sender.sendMessages(message, options)
    } catch (err) {
      console.error(`${this.connectionName} failed to send message: `, err)
      throw err
    }
    return message
  }

  async closeConnection () {
    await this.sender.close()
    await super.closeConnection()
  }

  enrichMessage (message) {
    return {
      body: message.body,
      correlationId: message.correlationId,
      subject: message.subject,
      applicationProperties: {
        type: message.type,
        source: message.source
      }
    }
  }
}

module.exports = MessageSender
