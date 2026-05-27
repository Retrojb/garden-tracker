/**
 * useWeather hook
 *
 * Fetches current weather data for a given zip code or device GPS location.
 * Results are cached in MMKV for up to 10 minutes (TTL = 600_000 ms).
 *
 * Cache strategy:
 *  - Fresh  (< 10 min): return cached data immediately, no API call.
 *  - Stale  (≥ 10 min): trigger a background refresh; serve null while
 *                        refreshing. If the refresh fails, set error state.
 *  - Miss              : fetch from API, cache result.
 *
 * Location permission denied: emits an event via `locationPermissionDenied`
 * so screens can subscribe and prompt the user for a zip code fallback.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MMKV } from 'react-native-mmkv'

import { apiClient } from '@/src/lib/apiClient'
import { IWeatherOptions, IWeatherResponse } from '../types/TWeather'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cache TTL in milliseconds (10 minutes). */
const WEATHER_CACHE_TTL_MS = 600_000

// ---------------------------------------------------------------------------
// MMKV instance (module-level singleton)
// ---------------------------------------------------------------------------

const storage = new MMKV()

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

interface WeatherCacheEntry {
  data: IWeatherResponse
  timestamp: number
}

const buildCacheKey = (qualifier: string): string =>
  `weather_cache_${qualifier}`

const readCache = (key: string): WeatherCacheEntry | null => {
  const raw = storage.getString(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WeatherCacheEntry
  } catch {
    return null
  }
}

const writeCache = (key: string, data: IWeatherResponse): void => {
  const entry: WeatherCacheEntry = { data, timestamp: Date.now() }
  storage.set(key, JSON.stringify(entry))
}

const isCacheFresh = (entry: WeatherCacheEntry): boolean =>
  Date.now() - entry.timestamp < WEATHER_CACHE_TTL_MS

// ---------------------------------------------------------------------------
// Location permission denied event emitter
// ---------------------------------------------------------------------------

/**
 * Simple synchronous event registry for the "location permission denied"
 * event. Screens subscribe via `locationPermissionDenied.subscribe(fn)` and
 * unsubscribe by calling the returned cleanup function.
 *
 * @example
 * ```ts
 * const unsub = locationPermissionDenied.subscribe(() => {
 *   setShowZipPrompt(true);
 * });
 * return () => unsub();
 * ```
 */
export const locationPermissionDenied = {
  _listeners: new Set<() => void>(),

  emit(): void {
    this._listeners.forEach((fn) => fn())
  },

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => {
      this._listeners.delete(fn)
    }
  },
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseWeatherResult {
  weather: IWeatherResponse | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetches and caches current weather data.
 *
 * @param options - `zipCode` or `useDeviceLocation` (at least one required)
 */
const useWeather = (options: IWeatherOptions): UseWeatherResult => {
  const { zipCode, useDeviceLocation } = options

  const [weather, setWeather] = useState<IWeatherResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Ref to track whether the component is still mounted so we avoid
   * state updates after unmount.
   */
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Core fetch logic
  // ---------------------------------------------------------------------------

  /**
   * Resolves the query string segment (`zip=XXXXX` or `lat=X&lon=Y`) and the
   * MMKV cache key for the current options. Returns null when neither a zip
   * code nor device location is available (e.g. permission denied).
   */
  const resolveQueryAndKey = useCallback(async (): Promise<{
    query: string
    cacheKey: string
  } | null> => {
    if (useDeviceLocation) {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== Location.PermissionStatus.GRANTED) {
        // Emit event so the screen can show a zip code fallback prompt
        locationPermissionDenied.emit()
        return null
      }

      const position = await Location.getCurrentPositionAsync({})
      const { latitude: lat, longitude: lon } = position.coords
      return {
        query: `lat=${lat}&lon=${lon}`,
        cacheKey: buildCacheKey(`${lat}_${lon}`),
      }
    }

    if (zipCode) {
      return {
        query: `zip=${zipCode}`,
        cacheKey: buildCacheKey(zipCode),
      }
    }

    return null
  }, [useDeviceLocation, zipCode])

  /**
   * Performs the actual API call and writes the result to the MMKV cache.
   * Throws on failure so callers can handle the error.
   */
  const fetchFromApi = useCallback(
    async (query: string, cacheKey: string): Promise<IWeatherResponse> => {
      const response = await apiClient.get<IWeatherResponse>(`/weather?${query}`)
      writeCache(cacheKey, response.data)
      return response.data
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Main fetch orchestrator
  // ---------------------------------------------------------------------------

  const fetchWeather = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const resolved = await resolveQueryAndKey()

      if (!resolved) {
        // Permission denied — clear loading, leave weather as null
        if (mountedRef.current) {
          setIsLoading(false)
        }
        return
      }

      const { query, cacheKey } = resolved
      const cached = readCache(cacheKey)

      if (cached && isCacheFresh(cached)) {
        // Requirement 6.5: serve fresh cached data without an API call
        if (mountedRef.current) {
          setWeather(cached.data)
          setIsLoading(false)
        }
        return
      }

      if (cached && !isCacheFresh(cached)) {
        // Requirement 6.6 / 6.7: stale cache — trigger background refresh.
        // Do NOT serve stale data; keep weather as null while refreshing.
        if (mountedRef.current) {
          setWeather(null)
        }

        try {
          const fresh = await fetchFromApi(query, cacheKey)
          if (mountedRef.current) {
            setWeather(fresh)
            setIsLoading(false)
          }
        } catch (refreshErr) {
          // Requirement 6.7: background refresh failure → error state, no stale data
          if (mountedRef.current) {
            setError(
              refreshErr instanceof Error
                ? refreshErr
                : new Error(String(refreshErr))
            )
            setIsLoading(false)
          }
        }
        return
      }

      // Cache miss — fetch fresh data
      try {
        const fresh = await fetchFromApi(query, cacheKey)
        if (mountedRef.current) {
          setWeather(fresh)
          setIsLoading(false)
        }
      } catch (fetchErr) {
        // Requirement 6.8: API failure → error state, no crash
        if (mountedRef.current) {
          setError(
            fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr))
          )
          setIsLoading(false)
        }
      }
    } catch (outerErr) {
      // Catch-all for unexpected errors (e.g. location API failure)
      if (mountedRef.current) {
        setError(
          outerErr instanceof Error ? outerErr : new Error(String(outerErr))
        )
        setIsLoading(false)
      }
    }
  }, [resolveQueryAndKey, fetchFromApi])

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void fetchWeather()
  }, [fetchWeather])

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const refetch = useCallback((): void => {
    void fetchWeather()
  }, [fetchWeather])

  return { weather, isLoading, error, refetch }
}

export { useWeather }
