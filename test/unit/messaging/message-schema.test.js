const messageSchema = require('../../../app/messaging/message-schema')

describe('messageSchema', () => {
  test('should validate a valid message', async () => {
    const message = {
      body: { data: 'test' },
      type: 'UserCreated',
      source: 'user-service'
    }

    const result = await messageSchema.validateAsync(message)

    expect(result).toEqual(message)
  })

  test('should validate message with null body', async () => {
    const message = {
      body: null,
      type: 'UserCreated',
      source: 'user-service'
    }

    const result = await messageSchema.validateAsync(message)

    expect(result).toEqual(message)
  })

  test('should validate message with empty object body', async () => {
    const message = {
      body: {},
      type: 'UserCreated',
      source: 'user-service'
    }

    const result = await messageSchema.validateAsync(message)

    expect(result).toEqual(message)
  })

  test('should fail validation when type is missing', async () => {
    const message = {
      body: { data: 'test' },
      source: 'user-service'
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow()
  })

  test('should fail validation when source is missing', async () => {
    const message = {
      body: { data: 'test' },
      type: 'UserCreated'
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow()
  })

  test('should fail validation when type is not a string', async () => {
    const message = {
      body: { data: 'test' },
      type: 123,
      source: 'user-service'
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow()
  })

  test('should fail validation when source is not a string', async () => {
    const message = {
      body: { data: 'test' },
      type: 'UserCreated',
      source: 123
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow()
  })

  test('should allow unknown properties in message', async () => {
    const message = {
      body: { data: 'test' },
      type: 'UserCreated',
      source: 'user-service',
      customProperty: 'custom-value',
      anotherProperty: 123
    }

    const result = await messageSchema.validateAsync(message, { allowUnknown: true })

    expect(result).toEqual(message)
  })

  test('should fail validation with unknown properties when allowUnknown is false', async () => {
    const message = {
      body: { data: 'test' },
      type: 'UserCreated',
      source: 'user-service',
      customProperty: 'custom-value'
    }

    await expect(messageSchema.validateAsync(message, { allowUnknown: false })).rejects.toThrow()
  })

  test('should validate message with complex body object', async () => {
    const message = {
      body: {
        user: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com'
        },
        timestamp: '2026-02-10T00:00:00Z'
      },
      type: 'UserCreated',
      source: 'user-service'
    }

    const result = await messageSchema.validateAsync(message)

    expect(result).toEqual(message)
  })
})
