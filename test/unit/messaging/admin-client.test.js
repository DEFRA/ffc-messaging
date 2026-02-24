const AdminClient = require('../../../app/messaging/admin-client')
const { ServiceBusAdministrationClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

jest.mock('@azure/service-bus')
jest.mock('@azure/identity')

describe('AdminClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with config.name when provided', () => {
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    expect(() => new AdminClient(config)).not.toThrow()
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test-connection-string')
  })

  test('should initialize with config.address when name is not provided', () => {
    const config = {
      address: 'test-address',
      connectionString: 'test-connection-string'
    }

    expect(() => new AdminClient(config)).not.toThrow()
  })

  test('should initialize with appInsights from config', () => {
    const mockAppInsights = { defaultClient: {} }
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string',
      appInsights: mockAppInsights
    }

    expect(() => new AdminClient(config)).not.toThrow()
  })

  test('should create ServiceBusAdministrationClient with connectionString', () => {
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    expect(() => new AdminClient(config)).not.toThrow()
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test-connection-string')
  })

  test('should create ServiceBusAdministrationClient with credential chain when useCredentialChain is true', () => {
    const mockCredentials = {}
    DefaultAzureCredential.mockReturnValue(mockCredentials)

    const config = {
      name: 'test-connection',
      useCredentialChain: true,
      host: 'test-host'
    }

    expect(() => new AdminClient(config)).not.toThrow()
    expect(DefaultAzureCredential).toHaveBeenCalled()
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test-host', mockCredentials)
  })

  test('should create ServiceBusAdministrationClient with managedIdentityClientId', () => {
    const mockCredentials = {}
    DefaultAzureCredential.mockReturnValue(mockCredentials)

    const config = {
      name: 'test-connection',
      useCredentialChain: true,
      host: 'test-host',
      managedIdentityClientId: 'test-client-id'
    }

    expect(() => new AdminClient(config)).not.toThrow()
    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: 'test-client-id' })
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test-host', mockCredentials)
  })

  test('should create ServiceBusAdministrationClient with constructed connection string', () => {
    const config = {
      name: 'test-connection',
      host: 'test-host',
      username: 'test-user',
      password: 'test-password'
    }

    expect(() => new AdminClient(config)).not.toThrow()
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith(
      'Endpoint=sb://test-host/;SharedAccessKeyName=test-user;SharedAccessKey=test-password'
    )
  })

  test('should return sbClient from getClient method', async () => {
    const config = {
      name: 'test-connection',
      connectionString: 'test-connection-string'
    }

    const client = new AdminClient(config)
    const result = await client.getClient()

    expect(result).toBe(client.sbClient)
  })
})
