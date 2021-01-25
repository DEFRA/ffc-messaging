const MessageBase = require('./message-base')
const messageSchema = require('./message-schema')
const { trackTrace } = require('../app-insights')

class MessageSender extends MessageBase {
  constructor (config) {
    config.name = `${config.address}-sender`
    super(config)
    this.sendMessage = this.sendMessage.bind(this)
    this.sender = this.sbClient.createSender(config.address)
  }

  async sendMessage (message) {
    try {
      await messageSchema.validateAsync(message)
      message = this.enrichMessage(message)
      trackTrace(this.appInsights, this.connectionName)
      await this.sender.sendMessages(message)
    } catch (err) {
      console.error(`${this.connectionName} failed to send message: `, err)
      throw err
    } finally {
      await this.sender.close()
      await super.closeConnection()
    }
    return message
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
