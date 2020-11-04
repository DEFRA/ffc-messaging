const MessageBase = require('./message-base')
const messageSchema = require('./message-schema')

class MessageSender extends MessageBase {
  constructor (config) {
    config.name = `${config.address}-sender`
    super(config)
    this.sendMessage = this.sendMessage.bind(this)
  }

  async sendMessage (message) {
    const sender = this.entityClient.createSender()
    try {
      await messageSchema.validateAsync(message)
      message = this.enrichMessage(message)
      await sender.send(message)
    } catch (err) {
      console.error(`${this.connectionName} failed to send message: `, err)
      throw err
    } finally {
      await sender.close()
    }
    return message
  }

  enrichMessage (message) {
    return {
      body: message.body,
      userProperties: {
        subject: message.subject,
        type: message.type,
        source: message.source
      }
    }
  }
}

module.exports = MessageSender
