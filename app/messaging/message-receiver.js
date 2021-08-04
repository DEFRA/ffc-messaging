const MessageBase = require('./message-base')
const { trackTrace, trackException } = require('../app-insights')

class MessageReceiver extends MessageBase {
  constructor (config, action) {
    super(config)
    this.receiverHandler = this.receiverHandler.bind(this)
    this.action = action
    this.receiver = this.createReceiver(config)
  }

  createReceiver (config) {
    switch (config.type) {
      case 'subscription':
        return this.sbClient.createReceiver(config.topic, config.address)
      case 'queue':
        return this.sbClient.createReceiver(config.address)
      default:
        return undefined
    }
  }

  async subscribe () {
    await this.receiver.subscribe({
      processMessage: this.receiverHandler,
      processError: async (args) => {
        this.receiverError(args.error)
      }
    }, {
      autoCompleteMessages: this.config.autoCompleteMessages || false
    })
  }

  async acceptSession (sessionId) {
    this.receiver = await this.sbClient.acceptSession(this.config.address, sessionId)
  }

  async acceptNextSession () {
    this.receiver = await this.sbClient.acceptNextSession(this.config.address)
  }

  async peekMessages (maxMessageCount, options = {}) {
    return await this.receiver.peekMessages(maxMessageCount, options)
  }

  async receiveMessages (maxMessageCount, options = {}) {
    return await this.receiver.receiveMessages(maxMessageCount, options)
  }

  async completeMessage (message) {
    await this.receiver.completeMessage(message)
  }

  async deadLetterMessage (message) {
    await this.receiver.deadLetterMessage(message)
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
