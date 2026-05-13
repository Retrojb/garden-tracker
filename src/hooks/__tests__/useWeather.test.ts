/**
 * Unit tests for the useWeather hook.
 *
 * Covers:
 *  1. Returns cached data when cache is < 10 min old (no API call)
 *  2. Triggers background refresh when cache is ≥ 10 min old
 *  3. Sets error state when API call fails (cache miss path)
 *  4. Sets error state when background refresh fails; does not serve stale data
 *  5. Requests device location when `useDeviceLocation` is true
 *  6. Emits location permission denied event when permission is denied
 *  7. Uses zip code query param when `zipCode` is provided
 *  8. Uses lat/lon query params when device location is used
 */

import { act, renderHook, waitFor } from '@testing-library/react-native'

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

// Mock expo-location
jest.mock('expo-location', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}))

// Mock apiClient
jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

// react-native-mmkv is already mapped to the in-memory mock via jest.config.js

import type { WeatherResponse } from '@/src/index'
import { apiClient } from '@/src/lib/apiClient'
import * as Location from 'expo-location'
import { locationPermissionDenied, useWeather } from '../useWeather'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.MockedFunction<
    typeof Location.requestForegroundPermissionsAsync
  >

const mockGetCurrentPosition =
  Location.getCurrentPositionAsync as jest.MockedFunction<
    typeof Location.getCurrentPositionAsync
  >

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_WEATHER: WeatherResponse = {
  location: 'Springfield',
  temperatureF: 72,
  temperatureC: 22.2,
  condition: 'Sunny',
  iconCode: '01d',
  humidity: 45,
  windSpeedMph: 8,
  observedAt: new Date().toISOString(),
}

const WEATHER_CACHE_TTL_MS = 600_000 // 10 minutes — must match hook constant

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the JSON string that the MMKV mock would store for a cache entry.
 */
const buildCacheEntry = (data: WeatherResponse, timestamp: number): string =>
  JSON.stringify({ data, timestamp })

/**
 * Directly seeds the MMKV in-memory store used by the hook.
 * We import MMKV from the mock (mapped by jest.config.js) and write to it.
 */
const seedMmkvCache = (key: string, entry: string): void => {
  // The hook creates `new MMKV()` — because the mock class uses a module-level
  // Map, all instances share the same backing store in tests.
  const { MMKV } = jest.requireMock<{
    MMKV: typeof import('react-native-mmkv').MMKV
  }>('react-native-mmkv')
  const store = new MMKV()
  store.set(key, entry)
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()

  // Clear the MMKV in-memory store between tests
  const { MMKV } = jest.requireMock<{
    MMKV: typeof import('react-native-mmkv').MMKV
  }>('react-native-mmkv')
  new MMKV().clearAll()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWeather', () => {
  // -------------------------------------------------------------------------
  // 1. Returns cached data when cache is < 10 min old (no API call)
  // -------------------------------------------------------------------------
  it('returns cached data and makes no API call when cache is fresh (< 10 min)', async () => {
    const cacheKey = 'weather_cache_90210'
    const freshTimestamp = Date.now() - 60_000 // 1 minute ago — still fresh
    seedMmkvCache(cacheKey, buildCacheEntry(MOCK_WEATHER, freshTimestamp))

    const { result } = renderHook(() => useWeather({ zipCode: '90210' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.weather).toEqual(MOCK_WEATHER)
    expect(result.current.error).toBeNull()
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 2. Triggers background refresh when cache is ≥ 10 min old
  // -------------------------------------------------------------------------
  it('triggers a background refresh and returns fresh data when cache is stale (≥ 10 min)', async () => {
    const cacheKey = 'weather_cache_90210'
    const staleTimestamp = Date.now() - WEATHER_CACHE_TTL_MS - 1_000 // 1 s past TTL
    seedMmkvCache(cacheKey, buildCacheEntry(MOCK_WEATHER, staleTimestamp))

    const freshWeather: WeatherResponse = { ...MOCK_WEATHER, temperatureF: 80 }
    mockApiGet.mockResolvedValueOnce({ data: freshWeather, status: 200 })

    const { result } = renderHook(() => useWeather({ zipCode: '90210' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledTimes(1)
    expect(mockApiGet).toHaveBeenCalledWith(
      expect.stringContaining('zip=90210')
    )
    expect(result.current.weather).toEqual(freshWeather)
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 3. Sets error state when API call fails (cache miss)
  // -------------------------------------------------------------------------
  it('sets error state when the API call fails on a cache miss', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useWeather({ zipCode: '12345' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.weather).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
  })

  // -------------------------------------------------------------------------
  // 4. Sets error state when background refresh fails; does not serve stale data
  // -------------------------------------------------------------------------
  it('sets error state and does not serve stale data when background refresh fails', async () => {
    const cacheKey = 'weather_cache_12345'
    const staleTimestamp = Date.now() - WEATHER_CACHE_TTL_MS - 5_000
    seedMmkvCache(cacheKey, buildCacheEntry(MOCK_WEATHER, staleTimestamp))

    mockApiGet.mockRejectedValueOnce(new Error('Refresh failed'))

    const { result } = renderHook(() => useWeather({ zipCode: '12345' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Must NOT serve stale data (Requirement 6.7)
    expect(result.current.weather).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Refresh failed')
  })

  // -------------------------------------------------------------------------
  // 5. Requests device location when `useDeviceLocation` is true
  // -------------------------------------------------------------------------
  it('requests device location when useDeviceLocation is true', async () => {
    mockRequestPermissions.mockResolvedValueOnce({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockGetCurrentPosition.mockResolvedValueOnce({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
    mockApiGet.mockResolvedValueOnce({ data: MOCK_WEATHER, status: 200 })

    const { result } = renderHook(() => useWeather({ useDeviceLocation: true }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1)
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
    expect(result.current.weather).toEqual(MOCK_WEATHER)
  })

  // -------------------------------------------------------------------------
  // 6. Emits location permission denied event when permission is denied
  // -------------------------------------------------------------------------
  it('emits locationPermissionDenied event when location permission is denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      expires: 'never',
      canAskAgain: false,
    })

    const listener = jest.fn()
    const unsub = locationPermissionDenied.subscribe(listener)

    const { result } = renderHook(() => useWeather({ useDeviceLocation: true }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(result.current.weather).toBeNull()
    expect(result.current.error).toBeNull()

    unsub()
  })

  // -------------------------------------------------------------------------
  // 7. Uses zip code query param when `zipCode` is provided
  // -------------------------------------------------------------------------
  it('calls the API with ?zip=XXXXX when zipCode is provided', async () => {
    mockApiGet.mockResolvedValueOnce({ data: MOCK_WEATHER, status: 200 })

    const { result } = renderHook(() => useWeather({ zipCode: '54321' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/weather?zip=54321')
  })

  // -------------------------------------------------------------------------
  // 8. Uses lat/lon query params when device location is used
  // -------------------------------------------------------------------------
  it('calls the API with ?lat=X&lon=Y when device location is used', async () => {
    const lat = 40.7128
    const lon = -74.006

    mockRequestPermissions.mockResolvedValueOnce({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockGetCurrentPosition.mockResolvedValueOnce({
      coords: {
        latitude: lat,
        longitude: lon,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
    mockApiGet.mockResolvedValueOnce({ data: MOCK_WEATHER, status: 200 })

    const { result } = renderHook(() => useWeather({ useDeviceLocation: true }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith(`/weather?lat=${lat}&lon=${lon}`)
  })

  // -------------------------------------------------------------------------
  // Additional: refetch triggers a new API call
  // -------------------------------------------------------------------------
  it('refetch triggers a new API call', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: MOCK_WEATHER, status: 200 })
      .mockResolvedValueOnce({
        data: { ...MOCK_WEATHER, temperatureF: 99 },
        status: 200,
      })

    const { result } = renderHook(() => useWeather({ zipCode: '11111' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.weather?.temperatureF).toBe(72)

    // Clear the cache so refetch hits the API again
    const { MMKV } = jest.requireMock<{
      MMKV: typeof import('react-native-mmkv').MMKV
    }>('react-native-mmkv')
    new MMKV().clearAll()

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledTimes(2)
    expect(result.current.weather?.temperatureF).toBe(99)
  })
})
