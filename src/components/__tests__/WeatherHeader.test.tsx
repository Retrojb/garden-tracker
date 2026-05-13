/**
 * Unit tests for WeatherHeader component.
 *
 * Covers:
 *  1. Renders temperature and condition when weather data is available
 *  2. Shows loading indicator while fetching
 *  3. Shows error message when the hook returns an error
 *  4. Toggles expanded/collapsed state on header press
 *  5. Renders humidity and wind speed in expanded view
 *  6. Shows zip input when no initial zip is provided
 *  7. Commits zip code on submit and passes it to the hook
 */

import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

import type { WeatherResponse } from '@/src/index'

// ---------------------------------------------------------------------------
// Mock useWeather so we control what the hook returns
// ---------------------------------------------------------------------------

jest.mock('@/src/hooks/useWeather', () => ({
  useWeather: jest.fn(),
}))

// Mock react-native-reanimated to avoid native module issues in tests
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

import { useWeather } from '@/src/hooks/useWeather'
import { WeatherHeader } from '../../features/WeatherHeader'

const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_WEATHER: WeatherResponse = {
  location: 'Springfield',
  temperatureF: 72.4,
  temperatureC: 22.4,
  condition: 'Partly Cloudy',
  iconCode: '02d',
  humidity: 55,
  windSpeedMph: 10,
  observedAt: new Date().toISOString(),
}

const IDLE_STATE = {
  weather: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeatherHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. Renders temperature and condition
  // -------------------------------------------------------------------------
  it('renders temperature and condition when weather data is available', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherHeader initialZipCode="90210" />)

    expect(screen.getByText('72°F')).toBeTruthy()
    expect(screen.getByText('Partly Cloudy')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 2. Shows loading indicator
  // -------------------------------------------------------------------------
  it('shows a loading indicator while fetching', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherHeader initialZipCode="90210" />)

    expect(screen.getByText('Loading weather…')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 3. Shows error message
  // -------------------------------------------------------------------------
  it('shows an error message when the hook returns an error', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    })

    render(<WeatherHeader initialZipCode="90210" />)

    expect(screen.getByText('Network error')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 4. Toggles expanded / collapsed on header press
  // -------------------------------------------------------------------------
  it('toggles the expand/collapse chevron when the header row is pressed', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherHeader initialZipCode="90210" />)

    // Initially expanded — chevron should be ▲
    expect(screen.getByText('▲')).toBeTruthy()

    // Press to collapse
    fireEvent.press(screen.getByAccessibilityLabel('Collapse weather'))
    expect(screen.getByText('▼')).toBeTruthy()

    // Press to expand again
    fireEvent.press(screen.getByAccessibilityLabel('Expand weather'))
    expect(screen.getByText('▲')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 5. Renders humidity and wind speed in expanded view
  // -------------------------------------------------------------------------
  it('renders humidity and wind speed details', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherHeader initialZipCode="90210" />)

    expect(screen.getByText('55%')).toBeTruthy()
    expect(screen.getByText('10 mph')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 6. Shows zip input when no initial zip is provided
  // -------------------------------------------------------------------------
  it('shows the zip code input when no initialZipCode is provided', () => {
    mockUseWeather.mockReturnValue(IDLE_STATE)

    render(<WeatherHeader />)

    expect(screen.getByAccessibilityLabel('Enter zip code')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 7. Commits zip code on submit
  // -------------------------------------------------------------------------
  it('passes the entered zip code to useWeather after submission', () => {
    mockUseWeather.mockReturnValue(IDLE_STATE)

    render(<WeatherHeader />)

    const input = screen.getByAccessibilityLabel('Enter zip code')
    fireEvent.changeText(input, '12345')
    fireEvent(input, 'submitEditing')

    // useWeather should have been called with the new zip
    expect(mockUseWeather).toHaveBeenCalledWith(
      expect.objectContaining({ zipCode: '12345' })
    )
  })

  // -------------------------------------------------------------------------
  // 8. Shows placeholder temperature when no weather data yet
  // -------------------------------------------------------------------------
  it('shows placeholder temperature when weather data is not yet available', () => {
    mockUseWeather.mockReturnValue(IDLE_STATE)

    render(<WeatherHeader initialZipCode="90210" />)

    expect(screen.getByText('--°F')).toBeTruthy()
  })
})
