/**
 * Typed MMKV storage helpers.
 *
 * Wraps `react-native-mmkv` with generic typed get/set/delete/clear helpers
 * and provides weather-specific cache helpers used by `useWeather`.
 *
 * Requirements: 6.4, 6.5, 8.1
 */

import { MMKV } from '../__mocks__/react-native-mmkv'
import { IWeatherCacheEntry } from '../types/TCache'
import { IWeatherResponse } from '../types/TWeather'

const storage = new MMKV()

// ---------------------------------------------------------------------------
// Generic typed helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve a JSON-serialised value by key.
 * Returns `null` when the key does not exist or the stored value cannot be
 * parsed.
 */
const get = <T>(key: string): T | null => {
  const raw = storage.getString(key)
  if (raw === undefined) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Serialise `value` to JSON and persist it under `key`.
 */
const set = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value))
}

/**
 * Remove a single key from storage.
 */
const deleteKey = (key: string): void => {
  storage.delete(key)
}

/**
 * Remove all keys from storage.
 */
const clear = (): void => {
  storage.clearAll()
}

/**
 * Retrieve a cached weather entry.
 * Returns `null` when no entry exists for the given key.
 */
const getCachedWeather = (key: string): IWeatherCacheEntry | null => {
  return get<IWeatherCacheEntry>(key)
}

/**
 * Persist a weather response together with the time it was fetched.
 */
const setCachedWeather = (
  key: string,
  data: IWeatherResponse,
  timestamp: number
): void => {
  set<IWeatherCacheEntry>(key, { data, timestamp })
}

export { clear, deleteKey, get, getCachedWeather, set, setCachedWeather }
