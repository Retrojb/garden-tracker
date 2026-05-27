/**
 * Property-Based Tests for useWeather hook — Cache Freshness
 *
 * **Property 6: Weather Cache Freshness** — while cached entry is < 10 min old,
 * no new API call is made; when ≥ 10 min old, a background refresh is triggered.
 *
 * **Validates: Requirements 6.4, 6.5, 6.6**
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('expo-location', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}))

jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import type { IWeatherResponse } from '@/src/types/TWeather'
import { renderHook, waitFor } from '@testing-library/react-native'
import * as fc from 'fast-check'
import { useWeather } from '../useWeather'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEATHER_CACHE_TTL_MS = 600_000 // 10 minutes — must match hook constant

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid 5-digit US zip code string.
 */
const zipCodeArb = fc.stringMatching(/^\d{5}$/)

/**
 * Generates a valid IWeatherResponse object.
 */
const weatherResponseArb: fc.Arbitrary<IWeatherResponse> = fc.record({
  location: fc.string({ minLength: 1, maxLength: 30 }),
  temperatureF: fc.float({ min: -50, max: 130, noNaN: true, noDefaultInfinity: true }).map((v) => v === 0 ? 0 : v),
  temperatureC: fc.float({ min: -50, max: 55, noNaN: true, noDefaultInfinity: true }).map((v) => v === 0 ? 0 : v),
  condition: fc.string({ minLength: 1, maxLength: 30 }),
  iconCode: fc.stringMatching(/^[0-9]{2}[dn]$/),
  humidity: fc.integer({ min: 0, max: 100 }),
  windSpeedMph: fc.float({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }).map((v) => v === 0 ? 0 : v),
  observedAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
})

/**
 * Generates a cache age in milliseconds that is strictly less than 10 minutes
 * (fresh cache). Range: [0, 599_999].
 */
const freshCacheAgeArb = fc.integer({ min: 0, max: WEATHER_CACHE_TTL_MS - 1 })

/**
 * Generates a cache age in milliseconds that is >= 10 minutes (stale cache).
 * Range: [600_000, 3_600_000] (10 min to 1 hour).
 */
const staleCacheAgeArb = fc.integer({
  min: WEATHER_CACHE_TTL_MS,
  max: 3_600_000,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Import MMKV from the same path the hook uses so we share the same module
// instance (and therefore the same shared backing store).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MMKV: MMKVClass } = require('react-native-mmkv')

/**
 * Seeds the MMKV in-memory store with a weather cache entry.
 * Uses the same MMKV class the hook uses to ensure shared state.
 */
const seedMmkvCache = (key: string, entry: string): void => {
  const store = new MMKVClass()
  store.set(key, entry)
}

/**
 * Clears the MMKV in-memory store.
 */
const clearMmkvCache = (): void => {
  const store = new MMKVClass()
  store.clearAll()
}

/**
 * Builds the JSON string for a weather cache entry.
 */
const buildCacheEntry = (
  data: IWeatherResponse,
  timestamp: number
): string => JSON.stringify({ data, timestamp })

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()

  // Clear the MMKV in-memory store between tests
  clearMmkvCache()
})

// ---------------------------------------------------------------------------
// Property 6: Weather Cache Freshness
// ---------------------------------------------------------------------------

describe('Property 6: Weather Cache Freshness', () => {
  /**
   * Sub-property A: While cached entry is < 10 min old, no new API call is made.
   *
   * For any valid zip code, any valid WeatherResponse, and any cache age
   * strictly less than 10 minutes, the hook serves the cached data without
   * making an API call.
   *
   * **Validates: Requirements 6.4, 6.5**
   */
  it('serves cached data without API call when cache age < 10 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        zipCodeArb,
        weatherResponseArb,
        freshCacheAgeArb,
        async (zipCode, cachedWeather, ageMs) => {
          jest.clearAllMocks()

          // Clear MMKV store
          clearMmkvCache()

          // Fix Date.now() so the hook sees a consistent "now"
          const now = 1_700_000_000_000
          jest.spyOn(Date, 'now').mockReturnValue(now)

          // Seed cache with an entry that is `ageMs` milliseconds old
          const cacheKey = `weather_cache_${zipCode}`
          const cacheTimestamp = now - ageMs
          seedMmkvCache(cacheKey, buildCacheEntry(cachedWeather, cacheTimestamp))

          const { result, unmount } = renderHook(() =>
            useWeather({ zipCode })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          // The hook must serve cached data
          expect(result.current.weather).toEqual(cachedWeather)
          expect(result.current.error).toBeNull()

          // No API call should have been made
          expect(mockApiGet).not.toHaveBeenCalled()

          unmount()
          jest.restoreAllMocks()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Sub-property B: When cached entry is >= 10 min old, a background refresh
   * is triggered (API call is made).
   *
   * For any valid zip code, any valid WeatherResponse in cache, and any cache
   * age >= 10 minutes, the hook triggers a new API call to refresh the data.
   *
   * **Validates: Requirements 6.4, 6.6**
   */
  it('triggers a background refresh (API call) when cache age >= 10 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        zipCodeArb,
        weatherResponseArb,
        weatherResponseArb,
        staleCacheAgeArb,
        async (zipCode, staleWeather, freshWeather, ageMs) => {
          jest.clearAllMocks()

          // Clear MMKV store
          clearMmkvCache()

          // Fix Date.now() so the hook sees a consistent "now"
          const now = 1_700_000_000_000
          jest.spyOn(Date, 'now').mockReturnValue(now)

          // Seed cache with a stale entry (>= 10 min old)
          const cacheKey = `weather_cache_${zipCode}`
          const cacheTimestamp = now - ageMs
          seedMmkvCache(cacheKey, buildCacheEntry(staleWeather, cacheTimestamp))

          // Mock the API to return fresh weather data
          mockApiGet.mockResolvedValueOnce({
            data: freshWeather,
            status: 200,
          })

          const { result, unmount } = renderHook(() =>
            useWeather({ zipCode })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          // A background refresh API call must have been triggered
          expect(mockApiGet).toHaveBeenCalledTimes(1)
          expect(mockApiGet).toHaveBeenCalledWith(
            expect.stringContaining(`zip=${zipCode}`)
          )

          // The hook should now serve the fresh data from the API
          expect(result.current.weather).toEqual(freshWeather)
          expect(result.current.error).toBeNull()

          unmount()
          jest.restoreAllMocks()
        }
      ),
      { numRuns: 50 }
    )
  })
})
