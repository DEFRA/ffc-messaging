const MessageSender = require('../../../app/messaging/message-sender')
const messageSchema = require('../../../app/messaging/message-schema')
const retry = require('../../../app/retry')
const { trackTrace } = require('../../../app/app-insights')

jest.mock('../../../app/messaging/message-base')
jest.mock('../../../app/messaging/message-schema')
jest.mock('../../../app/retry')
jest.mock('../../../app/app-insights')

describe('MessageSender', () => {
  let mockSender
  let mockSbClient
  let MessageBase

  beforeEach(() => {
    jest.clearAllMocks()

    mockSender = {
      sendMessages: jest.fn().mockResolvedValue(undefined),
      scheduleMessages: jest.fn().mockResolvedValue(undefined),
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

    expect(() => new MessageSender(config)).not.toThrow()
    expect(mockSbClient.createSender).toHaveBeenCalledWith('test-queue')
  })

  test('should bind sendMessage method', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const sender = new MessageSender(config)

    expect(sender.sendMessage.name).toBe('bound sendMessage')
  })

  test('should validate message using messageSchema', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const sender = new MessageSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await sender.sendMessage(message)

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

    const sender = new MessageSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    const result = await sender.sendMessage(message)

    expect(result).toEqual({
      type: 'test',
      source: 'test-source',
      body: 'test-body',
      applicationProperties: {
        type: 'test',
        source: 'test-source'
      }
    })
  })

  test('should enrich message with metadata in applicationProperties', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const sender = new MessageSender(config)

    const message = {
      type: 'test',
      source: 'test-source',
      body: 'test-body',
      metadata: { userId: '123', correlationId: 'abc-def' }
    }

    const result = await sender.sendMessage(message)

    expect(result).toEqual({
      type: 'test',
      source: 'test-source',
      body: 'test-body',
      metadata: { userId: '123', correlationId: 'abc-def' },
      applicationProperties: {
        type: 'test',
        source: 'test-source',
        userId: '123',
        correlationId: 'abc-def'
      }
    })
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

    const sender = new MessageSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await sender.sendMessage(message)

    expect(trackTrace).toHaveBeenCalledWith(mockAppInsights, 'test-connection')
  })

  test('should send message with retry', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: true
    }

    const sender = new MessageSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await sender.sendMessage(message)

    expect(retry).toHaveBeenCalledWith(
      expect.any(Function),
      3,
      100,
      true
    )
  })

  test('should return enriched message from sendMessage', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const sender = new MessageSender(config)

    const message = { type: 'event', source: 'my-service', body: 'content' }

    const result = await sender.sendMessage(message)

    expect(result).toHaveProperty('applicationProperties')
    expect(result.applicationProperties.type).toBe('event')
    expect(result.applicationProperties.source).toBe('my-service')
  })

  test('should send message through sender', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const sender = new MessageSender(config)

    const message = { body: 'test' }
    const options = { timeoutInMs: 5000 }

    await sender.send(message, options)

    expect(mockSender.sendMessages).toHaveBeenCalledWith(message, options)
  })

  test('should schedule message', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const sender = new MessageSender(config)

    const message = { body: 'test' }
    const scheduleTime = new Date('2026-02-11T10:00:00Z')

    await sender.scheduleMessage(message, scheduleTime)

    expect(mockSender.scheduleMessages).toHaveBeenCalledWith(message, scheduleTime)
  })

  test('should enrich message with correct properties', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string'
    }

    const sender = new MessageSender(config)

    const message = { type: 'event', source: 'my-service', body: 'content' }
    const enriched = sender.enrichMessage(message)

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

  test('should send message with default options', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      connectionString: 'test-connection-string',
      retries: 3,
      retryWaitInMs: 100,
      exponentialRetry: false
    }

    const sender = new MessageSender(config)

    const message = { type: 'test', source: 'test-source', body: 'test-body' }

    await sender.sendMessage(message)

    expect(mockSender.sendMessages).toHaveBeenCalledWith(
      expect.any(Object),
      {}
    )
  })
})
