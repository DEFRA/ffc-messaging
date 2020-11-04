const MessageBase = require('./message-base')

class MessageSender extends MessageBase {
  constructor (config) {
    config.name = `${config.address}-sender`
    super(config)
    this.sendMessage = this.sendMessage.bind(this)
  }

  async sendMessage (message) {
    const sender = this.entityClient.createSender()
    try {
      await sender.send(message)
    } catch (err) {
      console.error(`${this.connectionName} failed to send message: `, err)
      throw err
    } finally {
      await sender.close()
    }
    return message
  }
}

module.exports = MessageSender
