const trackException = require('../../../app/app-insights/track-exception')

describe('trackException', () => {
  test('should not throw when appInsights is undefined', () => {
    expect(() => trackException(undefined, 'test message')).not.toThrow()
  })

  test('should not throw when appInsights.defaultClient is undefined', () => {
    const appInsights = { defaultClient: undefined }
    expect(() => trackException(appInsights, 'test message')).not.toThrow()
  })

  test('should call trackException on defaultClient when appInsights is valid', () => {
    const mockTrackException = jest.fn()
    const appInsights = {
      defaultClient: {
        trackException: mockTrackException
      }
    }

    trackException(appInsights, 'test error message')

    expect(mockTrackException).toHaveBeenCalledWith({ message: 'test error message' })
    expect(mockTrackException).toHaveBeenCalledTimes(1)
  })

  test('should pass different messages to trackException', () => {
    const mockTrackException = jest.fn()
    const appInsights = {
      defaultClient: {
        trackException: mockTrackException
      }
    }

    trackException(appInsights, 'custom error')

    expect(mockTrackException).toHaveBeenCalledWith({ message: 'custom error' })
  })
})
