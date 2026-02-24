const MessageReceiver = require('../../../app/messaging/message-receiver')
const { trackTrace, trackException } = require('../../../app/app-insights')

jest.mock('../../../app/messaging/message-base')
jest.mock('../../../app/app-insights')

describe('MessageReceiver', () => {
  let mockReceiver
  let mockSbClient
  let mockAction
  let MessageBase

  beforeEach(() => {
    jest.clearAllMocks()

    mockReceiver = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      peekMessages: jest.fn().mockResolvedValue([]),
      receiveMessages: jest.fn().mockResolvedValue([]),
      completeMessage: jest.fn().mockResolvedValue(undefined),
      deadLetterMessage: jest.fn().mockResolvedValue(undefined),
      abandonMessage: jest.fn().mockResolvedValue(undefined),
      deferMessage: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    }

    mockSbClient = {
      createReceiver: jest.fn().mockReturnValue(mockReceiver),
      acceptSession: jest.fn().mockResolvedValue(mockReceiver),
      acceptNextSession: jest.fn().mockResolvedValue(mockReceiver),
      close: jest.fn().mockResolvedValue(undefined)
    }

    mockAction = jest.fn().mockResolvedValue(undefined)

    MessageBase = require('../../../app/messaging/message-base')
    MessageBase.mockImplementation(function (config) {
      this.config = config
      this.connectionName = config.name || config.address
      this.appInsights = config.appInsights
      this.sbClient = mockSbClient
    })
  })

  test('should initialize with config and action', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)

    expect(receiver.action).toBe(mockAction)
    expect(receiver.config).toEqual(config)
  })

  test('should create receiver for queue type', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    expect(() => new MessageReceiver(config, mockAction)).not.toThrow()
    expect(mockSbClient.createReceiver).toHaveBeenCalledWith('test-queue')
  })

  test('should create receiver for subscription type', () => {
    const config = {
      name: 'test-connection',
      address: 'test-subscription',
      topic: 'test-topic',
      type: 'subscription',
      connectionString: 'test-connection-string'
    }

    expect(() => new MessageReceiver(config, mockAction)).not.toThrow()
    expect(mockSbClient.createReceiver).toHaveBeenCalledWith('test-topic', 'test-subscription')
  })

  test('should return undefined receiver for unknown type', () => {
    const config = {
      name: 'test-connection',
      address: 'test-address',
      type: 'unknown',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)

    expect(receiver.receiver).toBeUndefined()
  })

  test('should bind receiverHandler method', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)

    expect(receiver.receiverHandler.name).toBe('bound receiverHandler')
  })

  test('should subscribe with default processError handler', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string',
      autoCompleteMessages: false,
      maxConcurrentCalls: 1
    }

    const receiver = new MessageReceiver(config, mockAction)
    await receiver.subscribe()

    expect(mockReceiver.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        processMessage: receiver.receiverHandler,
        processError: receiver.receiverError
      }),
      {
        autoCompleteMessages: false,
        maxConcurrentCalls: 1
      }
    )
  })

  test('should subscribe with custom processError handler', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const customErrorHandler = jest.fn()

    await receiver.subscribe(customErrorHandler)

    expect(mockReceiver.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        processError: customErrorHandler
      }),
      expect.any(Object)
    )
  })

  test('should subscribe with autoCompleteMessages and maxConcurrentCalls from config', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string',
      autoCompleteMessages: true,
      maxConcurrentCalls: 5
    }

    const receiver = new MessageReceiver(config, mockAction)
    await receiver.subscribe()

    expect(mockReceiver.subscribe).toHaveBeenCalledWith(
      expect.any(Object),
      {
        autoCompleteMessages: true,
        maxConcurrentCalls: 5
      }
    )
  })

  test('should accept session by sessionId', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    await receiver.acceptSession('session-123')

    expect(mockSbClient.acceptSession).toHaveBeenCalledWith('test-queue', 'session-123')
    expect(receiver.receiver).toBe(mockReceiver)
  })

  test('should accept next session', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    await receiver.acceptNextSession()

    expect(mockSbClient.acceptNextSession).toHaveBeenCalledWith('test-queue')
    expect(receiver.receiver).toBe(mockReceiver)
  })

  test('should peek messages', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const messages = [{ body: 'test' }]
    mockReceiver.peekMessages.mockResolvedValue(messages)

    const result = await receiver.peekMessages(10)

    expect(mockReceiver.peekMessages).toHaveBeenCalledWith(10, {})
    expect(result).toBe(messages)
  })

  test('should peek messages with options', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const options = { fromSequenceNumber: 100 }

    await receiver.peekMessages(10, options)

    expect(mockReceiver.peekMessages).toHaveBeenCalledWith(10, options)
  })

  test('should receive messages', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const messages = [{ body: 'test' }]
    mockReceiver.receiveMessages.mockResolvedValue(messages)

    const result = await receiver.receiveMessages(10)

    expect(mockReceiver.receiveMessages).toHaveBeenCalledWith(10, {})
    expect(result).toBe(messages)
  })

  test('should complete message', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const message = { body: 'test' }

    await receiver.completeMessage(message)

    expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('should dead letter message', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const message = { body: 'test' }

    await receiver.deadLetterMessage(message)

    expect(mockReceiver.deadLetterMessage).toHaveBeenCalledWith(message)
  })

  test('should abandon message', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const message = { body: 'test' }

    await receiver.abandonMessage(message)

    expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message)
  })

  test('should defer message', async () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const message = { body: 'test' }

    await receiver.deferMessage(message)

    expect(mockReceiver.deferMessage).toHaveBeenCalledWith(message)
  })

  test('should track exception in receiver error handler', () => {
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string'
    }

    const receiver = new MessageReceiver(config, mockAction)
    const error = new Error('test error')
    const args = { error }

    receiver.receiverError(args)

    expect(trackException).toHaveBeenCalledWith(receiver.appInsights, error)
  })

  test('should track trace in receiver handler', async () => {
    const mockAppInsights = { defaultClient: {} }
    const config = {
      name: 'test-connection',
      address: 'test-queue',
      type: 'queue',
      connectionString: 'test-connection-string',
      appInsights: mockAppInsights
    }

    const receiver = new MessageReceiver(config, mockAction)
    const message = { body: 'test' }

    await receiver.receiverHandler(message)

    expect(trackTrace).toHaveBeenCalledWith(mockAppInsights, 'test-connection')
    expect(mockAction).toHaveBeenCalledWith(message)
  })
})
