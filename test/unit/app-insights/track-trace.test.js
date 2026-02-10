const trackTrace = require('../../../app/app-insights/track-trace')

describe('trackTrace', () => {
  test('should not throw when appInsights is undefined', () => {
    expect(() => trackTrace(undefined, 'test message')).not.toThrow()
  })

  test('should not throw when appInsights.defaultClient is undefined', () => {
    const appInsights = { defaultClient: undefined }
    expect(() => trackTrace(appInsights, 'test message')).not.toThrow()
  })

  test('should call trackTrace on defaultClient when appInsights is valid', () => {
    const mockTrackTrace = jest.fn()
    const appInsights = {
      defaultClient: {
        trackTrace: mockTrackTrace
      }
    }

    trackTrace(appInsights, 'test trace message')

    expect(mockTrackTrace).toHaveBeenCalledWith({ message: 'test trace message' })
    expect(mockTrackTrace).toHaveBeenCalledTimes(1)
  })

  test('should pass different messages to trackTrace', () => {
    const mockTrackTrace = jest.fn()
    const appInsights = {
      defaultClient: {
        trackTrace: mockTrackTrace
      }
    }

    trackTrace(appInsights, 'custom trace info')

    expect(mockTrackTrace).toHaveBeenCalledWith({ message: 'custom trace info' })
  })
})
