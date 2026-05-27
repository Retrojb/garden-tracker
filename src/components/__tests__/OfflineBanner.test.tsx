import { OfflineBanner } from '@/src/components/OfflineBanner'
import { render, screen } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock @react-native-community/netinfo
// ---------------------------------------------------------------------------

const mockUseNetInfo = jest.fn()

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mockUseNetInfo(),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the offline banner when device is not connected', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false })

    render(<OfflineBanner />)

    expect(screen.getByTestId('offline-banner')).toBeTruthy()
    expect(screen.getByText('No internet connection')).toBeTruthy()
  })

  it('does not render when device is connected', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: true })

    render(<OfflineBanner />)

    expect(screen.queryByTestId('offline-banner')).toBeNull()
  })

  it('does not render while connectivity state is being determined (null)', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: null })

    render(<OfflineBanner />)

    expect(screen.queryByTestId('offline-banner')).toBeNull()
  })

  it('has accessible role and label for screen readers', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false })

    render(<OfflineBanner />)

    const banner = screen.getByTestId('offline-banner')
    expect(banner.props.accessibilityRole).toBe('alert')
    expect(banner.props.accessibilityLabel).toBe('You are offline')
  })

  it('hides when connectivity is restored', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false })

    const { rerender } = render(<OfflineBanner />)
    expect(screen.getByTestId('offline-banner')).toBeTruthy()

    // Simulate connectivity restored
    mockUseNetInfo.mockReturnValue({ isConnected: true })
    rerender(<OfflineBanner />)

    expect(screen.queryByTestId('offline-banner')).toBeNull()
  })
})
