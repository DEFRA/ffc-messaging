const { ReceiveMode } = require('@azure/service-bus')
const MessageBase = require('./message-base')
const { trackTrace, trackException } = require('../app-insights')

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

  receiverError (err) {
    trackException(this.appInsights, err)
    console.error(err)
    throw err
  }

  async receiverHandler (message) {
    trackTrace(this.appInsights, this.connectionName)
    await this.action(message)
  }

  async closeConnection () {
    await this.receiver.close()
    await super.closeConnection()
  }
}

module.exports = MessageReceiver
