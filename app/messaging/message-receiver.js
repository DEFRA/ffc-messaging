const MessageBase = require('./message-base')
const { trackTrace, trackException } = require('../app-insights')

class MessageReceiver extends MessageBase {
  constructor (config, action) {
    config.name = `${config.address}-receiver`
    super(config)
    this.receiverHandler = this.receiverHandler.bind(this)
    this.action = action
    this.receiver = config.type === 'subscription' ? this.sbClient.createReceiver(config.topic, config.address) : this.sbClient.createReceiver(config.address)
  }

  async subscribe () {
    await this.receiver.subscribe({
      processMessage: this.receiverHandler,
      processError: async (args) => {
        this.receiverError(args.error)
      }
    })
  }

  async peakMessages (maxMessageCount) {
    return await this.receiver.peekMessages(maxMessageCount)
  }

  async receiveMessages (maxMessageCount) {
    return await this.receiver.receiveMessages(maxMessageCount)
  }

  async completeMessage (message) {
    await this.receiver.completeMessage(message)
  }

  async deadLetterMessage (message) {
    await this.receiver.deadLetter(message)
  }

  async abandonMessage (message) {
    await this.receiver.abandonMessage(message)
  }

  async deferMessage (message) {
    await this.receiver.deferMessage(message)
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
