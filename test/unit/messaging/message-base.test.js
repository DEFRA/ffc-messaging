const MessageBase = require('../../../app/messaging/message-base')
const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

jest.mock('@azure/service-bus')
jest.mock('@azure/identity')

describe('MessageBase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with config.name when provided', () => {
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBase(config)

    expect(client.connectionName).toBe('test-connection')
    expect(client.appInsights).toBeUndefined()
    expect(client.config).toEqual(config)
  })

  test('should initialize with config.address when name is not provided', () => {
    const config = {
      address: 'test-address',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBase(config)

    expect(client.connectionName).toBe('test-address')
  })

  test('should initialize with appInsights from config', () => {
    const mockAppInsights = { defaultClient: {} }
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string',
      appInsights: mockAppInsights
    }

    const client = new MessageBase(config)

    expect(client.appInsights).toBe(mockAppInsights)
  })

  test('should create ServiceBusClient with connectionString', () => {
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(ServiceBusClient).toHaveBeenCalledWith('test-connection-string')
  })

  test('should create ServiceBusClient with credential chain when useCredentialChain is true', () => {
    const mockCredentials = {}
    DefaultAzureCredential.mockReturnValue(mockCredentials)

    const config = {
      name: 'test-connection',
      useCredentialChain: true,
      host: 'test-host'
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(DefaultAzureCredential).toHaveBeenCalled()
    expect(ServiceBusClient).toHaveBeenCalledWith('test-host', mockCredentials)
  })

  test('should create ServiceBusClient with managedIdentityClientId', () => {
    const mockCredentials = {}
    DefaultAzureCredential.mockReturnValue(mockCredentials)

    const config = {
      name: 'test-connection',
      useCredentialChain: true,
      host: 'test-host',
      managedIdentityClientId: 'test-client-id'
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: 'test-client-id' })
    expect(ServiceBusClient).toHaveBeenCalledWith('test-host', mockCredentials)
  })

  test('should include UseDevelopmentEmulator flag when useEmulator is true', () => {
    const config = {
      name: 'test-connection',
      host: 'test-host',
      username: 'test-user',
      password: 'test-password',
      useEmulator: true
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(ServiceBusClient).toHaveBeenCalledWith(
      'Endpoint=sb://test-host/;SharedAccessKeyName=test-user;SharedAccessKey=test-password;UseDevelopmentEmulator=true'
    )
  })

  test('should NOT include UseDevelopmentEmulator flag when useEmulator is false', () => {
    const config = {
      name: 'test-connection',
      host: 'test-host',
      username: 'test-user',
      password: 'test-password',
      useEmulator: false
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(ServiceBusClient).toHaveBeenCalledWith(
      'Endpoint=sb://test-host/;SharedAccessKeyName=test-user;SharedAccessKey=test-password'
    )
  })

  test('should NOT include UseDevelopmentEmulator flag when useEmulator is undefined', () => {
    const config = {
      name: 'test-connection',
      host: 'test-host',
      username: 'test-user',
      password: 'test-password'
    }

    expect(() => new MessageBase(config)).not.toThrow()
    expect(ServiceBusClient).toHaveBeenCalledWith(
      'Endpoint=sb://test-host/;SharedAccessKeyName=test-user;SharedAccessKey=test-password'
    )
  })

  test('should close connection', async () => {
    const mockClose = jest.fn().mockResolvedValue(undefined)
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    const client = new MessageBase(config)
    client.sbClient.close = mockClose

    await client.closeConnection()

    expect(mockClose).toHaveBeenCalled()
  })
})
