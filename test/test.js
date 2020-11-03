(async function () {
  const { MessageReceiver, MessageSender } = require('..')

  const config = {
    host: process.env.AZURE_SERVICE_BUS_HOST,
    username: process.env.AZURE_SERVICE_BUS_USERNAME,
    password: process.env.AZURE_SERVICE_BUS_PASSWORD,
    address: process.env.AZURE_SERVICE_BUS_QUEUE,
    usePodIdentity: false,
    type: 'queue'
  }

  const messageAction = function (message) {
    console.log(message.body)
  }

  const message = {
    claimId: 'M123'
  }

  // send and receive from queue
  const queueReceiver = new MessageReceiver(config, messageAction)
  await queueReceiver.connect()
  const queueSender = new MessageSender(config)
  await queueSender.connect()
  await queueSender.sendMessage(message)
  await queueSender.closeConnection()
  await queueReceiver.closeConnection()

  // send to topic and receive from subscription
  // const subscriptionReceiver = new MessageReceiver('topic-receiver', config.subscriptionConfig, messageAction)
  // const topicSender = new MessageSender('topic-sender', config.topicConfig)
  // await topicSender.sendMessage(message)
  // await topicSender.closeConnection()
  // await subscriptionReceiver.closeConnection()
}())
