const MessageBatchSender = require('../../../app/messaging/message-batch-sender')
const messageSchema = require('../../../app/messaging/message-schema')
const retry = require('../../../app/retry')
const { trackTrace } = require('../../../app/app-insights')

jest.mock('../../../app/messaging/message-base')
jest.mock('../../../app/messaging/message-schema')
jest.mock('../../../app/retry')
jest.mock('../../../app/app-insights')

describe('MessageBatchSender', () => {
  let mockSender
  let mockBatch
  let mockSbClient
  let MessageBase

  beforeEach(() => {
    jest.clearAllMocks()

    mockBatch = {
      tryAddMessage: jest.fn().mockReturnValue(true)
    }

    mockSender = {
      createMessageBatch: jest.fn().mockResolvedValue(mockBatch),
      sendMessages: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    }

    mockSbClient = {
      createSender: jest.fn().mockReturnValue(mockSender),
      close: jest.fn().mockResolvedValue(undefined)
    }

    retry.mockImplementation((fn) => fn())
    messageSchema.validateAsync.mockResolvedValue(undefined)

    MessageBase = require('../../../app/messaging/message-base')
    MessageBase.mockImplementation(function (config) {
      this.config = config
      this.connectionName = config.name || config.address
      this.appInsights = config.appInsights
      this.sbClient = mockSbClient
    })
  })

  test('should create sender with config.address', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    expect(() => new MessageBatchSender(config)).not.toThrow()
    expect(mockSbClient.createSender).toHaveBeenCalledWith('test-queue')
  })

  test('should bind sendBatchMessages method', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBatchSender(config)

    expect(client.sendBatchMessages.name).toBe('bound sendBatchMessages')
  })

  test('should validate messages using messageSchema', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await client.sendBatchMessages([message])

    expect(messageSchema.validateAsync).toHaveBeenCalledWith(message, { allowUnknown: true })
  })

  test('should enrich message with applicationProperties', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await client.sendBatchMessages([message])

    const enrichedMessage = {
      type: 'test',
      source: 'test-source',
      body: 'test-body',
      applicationProperties: {
        type: 'test',
        source: 'test-source'
      }
    }

    expect(mockBatch.tryAddMessage).toHaveBeenCalledWith(
      expect.objectContaining(enrichedMessage)
    )
  })

  test('should track trace for connection name', async () => {
    const mockAppInsights = { defaultClient: {} }
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      appInsights: mockAppInsights,
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await client.sendBatchMessages([message])

    expect(trackTrace).toHaveBeenCalledWith(mockAppInsights, 'test-connection')
  })

  test('should create new batch when tryAddMessage returns false', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    mockBatch.tryAddMessage.mockReturnValueOnce(false).mockReturnValueOnce(true)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await client.sendBatchMessages([message])

    expect(mockSender.createMessageBatch).toHaveBeenCalledTimes(2)
  })

  test('should throw error if message is too big for batch', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    mockBatch.tryAddMessage.mockReturnValue(false)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await expect(client.sendBatchMessages([message])).rejects.toThrow('Message too big to fit in a batch!')
  })

  test('should send batch with retry', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const client = new MessageBatchSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await client.sendBatchMessages([message])

    expect(retry).toHaveBeenCalled()
  })

  test('should send messages through sender', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBatchSender(config)

    const options = { timeoutInMs: 5000 }
    await client.send(mockBatch, options)

    expect(mockSender.sendMessages).toHaveBeenCalledWith(mockBatch, options)
  })

  test('should enrich message with correct properties', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBatchSender(config)

    const message = { type: 'event', source: 'my-service', body: 'content' }
    const enriched = client.enrichMessage(message)

    expect(enriched).toEqual({
      type: 'event',
      source: 'my-service',
      body: 'content',
      applicationProperties: {
        type: 'event',
        source: 'my-service'
      }
    })
  })
})
