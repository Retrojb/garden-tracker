/**
 * Unit tests for WeatherWidget component.
 *
 * Covers:
 *  1. Renders temperature, condition, and weather icon when data is available
 *  2. Shows loading skeleton while fetching
 *  3. Shows error state when the hook returns an error
 *  4. Shows error state when weather data is null (no data available)
 *  5. Compact mode renders smaller layout without location
 *  6. Passes zipCode to useWeather when provided
 *  7. Uses device location when no zipCode is provided
 *
 * Requirements: 6.3, 6.8
 */

import { render, screen } from '@testing-library/react-native'
import React from 'react'

import type { IWeatherResponse } from '@/src/types/TWeather'

// ---------------------------------------------------------------------------
// Mock useWeather
// ---------------------------------------------------------------------------

jest.mock('@/src/hooks/useWeather', () => ({
  useWeather: jest.fn(),
}))

import { useWeather } from '@/src/hooks/useWeather'
import { WeatherWidget } from '../WeatherWidget'

const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_WEATHER: IWeatherResponse = {
  location: 'Springfield',
  temperatureF: 72.4,
  temperatureC: 22.4,
  condition: 'Partly Cloudy',
  iconCode: '02d',
  humidity: 55,
  windSpeedMph: 10,
  observedAt: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeatherWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. Renders temperature, condition, and weather icon
  // -------------------------------------------------------------------------
  it('renders temperature, condition, and weather icon when data is available', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('72°F')).toBeTruthy()
    expect(screen.getByText('Partly Cloudy')).toBeTruthy()
    expect(screen.getByText('⛅')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 2. Shows loading skeleton while fetching
  // -------------------------------------------------------------------------
  it('shows loading skeleton while fetching', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByLabelText('Loading weather data')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 3. Shows error state when the hook returns an error
  // -------------------------------------------------------------------------
  it('shows error state when the hook returns an error', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('Unable to load weather data')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 4. Shows error state when weather data is null
  // -------------------------------------------------------------------------
  it('shows fallback state when weather data is null and not loading', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('No weather data available')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 5. Compact mode renders without location
  // -------------------------------------------------------------------------
  it('does not render location text in compact mode', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" compact />)

    expect(screen.getByText('72°F')).toBeTruthy()
    expect(screen.getByText('Partly Cloudy')).toBeTruthy()
    expect(screen.queryByText('Springfield')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 6. Non-compact mode renders location
  // -------------------------------------------------------------------------
  it('renders location text in non-compact mode', () => {
    mockUseWeather.mockReturnValue({
      weather: MOCK_WEATHER,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('Springfield')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 7. Passes zipCode to useWeather when provided
  // -------------------------------------------------------------------------
  it('passes zipCode to useWeather and disables device location', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="12345" />)

    expect(mockUseWeather).toHaveBeenCalledWith({
      zipCode: '12345',
      useDeviceLocation: false,
    })
  })

  // -------------------------------------------------------------------------
  // 8. Uses device location when no zipCode is provided
  // -------------------------------------------------------------------------
  it('uses device location when no zipCode is provided', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget />)

    expect(mockUseWeather).toHaveBeenCalledWith({
      zipCode: undefined,
      useDeviceLocation: true,
    })
  })

  // -------------------------------------------------------------------------
  // 9. Renders correct icon for known icon codes
  // -------------------------------------------------------------------------
  it('renders sun icon for clear day weather', () => {
    mockUseWeather.mockReturnValue({
      weather: { ...MOCK_WEATHER, iconCode: '01d' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('☀️')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 10. Renders default icon for unknown icon codes
  // -------------------------------------------------------------------------
  it('renders default icon for unknown icon codes', () => {
    mockUseWeather.mockReturnValue({
      weather: { ...MOCK_WEATHER, iconCode: 'unknown' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<WeatherWidget zipCode="90210" />)

    expect(screen.getByText('🌤️')).toBeTruthy()
  })
})
