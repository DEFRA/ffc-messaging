const { ReceiveMode } = require('@azure/service-bus')
const MessageBase = require('./message-base')

class MessageReceiver extends MessageBase {
  constructor (config, action) {
    config.name = `${config.address}-receiver`
    super(config)
    this.receiverHandler = this.receiverHandler.bind(this)
    this.action = action
  }

  async connect () {
    await super.connect()
    this.receiver = this.entityClient.createReceiver(ReceiveMode.peekLock)
    this.receiver.registerMessageHandler(this.receiverHandler, this.receiverError)
  }

  receiverError (error) {
    console.error(error)
  }

  async receiverHandler (message) {
    try {
      await this.action(message)
    } catch (err) {
      console.error(`${this.connectionName} failed to process message: `, err)
    }
  }

  async closeConnection () {
    await this.receiver.close()
    await super.closeConnection()
  }
}

module.exports = MessageReceiver
