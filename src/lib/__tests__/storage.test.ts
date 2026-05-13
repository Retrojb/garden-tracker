/**
 * Unit tests for src/lib/storage.ts
 *
 * The react-native-mmkv module is replaced by the in-memory mock at
 * src/__mocks__/react-native-mmkv.ts so these tests run in Node without
 * native binaries.
 */

import {
  clear,
  deleteKey,
  get,
  getCachedWeather,
  set,
  setCachedWeather,
} from '../storage'

import type { WeatherResponse } from '@/src/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeWeatherResponse = (
  overrides: Partial<WeatherResponse> = {}
): WeatherResponse => ({
  location: 'Springfield',
  temperatureF: 72,
  temperatureC: 22.2,
  condition: 'Sunny',
  iconCode: '01d',
  humidity: 45,
  windSpeedMph: 8,
  observedAt: '2024-06-01T12:00:00Z',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Reset storage between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  clear()
})

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

describe('get / set', () => {
  it('returns null for a key that has never been set', () => {
    expect(get('missing-key')).toBeNull()
  })

  it('returns the stored value after set', () => {
    set('greeting', 'hello')
    expect(get<string>('greeting')).toBe('hello')
  })

  it('round-trips a plain object', () => {
    const obj = { a: 1, b: 'two', c: true }
    set('obj', obj)
    expect(get<typeof obj>('obj')).toEqual(obj)
  })

  it('round-trips an array', () => {
    const arr = [1, 2, 3]
    set('arr', arr)
    expect(get<number[]>('arr')).toEqual(arr)
  })

  it('overwrites an existing value', () => {
    set('counter', 1)
    set('counter', 2)
    expect(get<number>('counter')).toBe(2)
  })
})

describe('deleteKey', () => {
  it('removes an existing key so get returns null', () => {
    set('temp', 'value')
    deleteKey('temp')
    expect(get('temp')).toBeNull()
  })

  it('does not throw when deleting a non-existent key', () => {
    expect(() => deleteKey('ghost')).not.toThrow()
  })
})

describe('clear', () => {
  it('removes all stored keys', () => {
    set('a', 1)
    set('b', 2)
    set('c', 3)
    clear()
    expect(get('a')).toBeNull()
    expect(get('b')).toBeNull()
    expect(get('c')).toBeNull()
  })

  it('is a no-op on an already-empty store', () => {
    expect(() => clear()).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Weather cache helpers
// ---------------------------------------------------------------------------

describe('getCachedWeather', () => {
  it('returns null when no cache entry exists for the key', () => {
    expect(getCachedWeather('weather:12345')).toBeNull()
  })

  it('returns the cached entry after setCachedWeather', () => {
    const data = makeWeatherResponse()
    const timestamp = Date.now()
    setCachedWeather('weather:12345', data, timestamp)

    const cached = getCachedWeather('weather:12345')
    expect(cached).not.toBeNull()
    expect(cached!.data).toEqual(data)
    expect(cached!.timestamp).toBe(timestamp)
  })

  it('returns null for a different key even when another key is cached', () => {
    const data = makeWeatherResponse()
    setCachedWeather('weather:11111', data, Date.now())
    expect(getCachedWeather('weather:99999')).toBeNull()
  })
})

describe('setCachedWeather', () => {
  it('stores data and timestamp together', () => {
    const data = makeWeatherResponse({
      location: 'Shelbyville',
      temperatureF: 65,
    })
    const timestamp = 1_700_000_000_000
    setCachedWeather('weather:shelbyville', data, timestamp)

    const cached = getCachedWeather('weather:shelbyville')
    expect(cached).toEqual({ data, timestamp })
  })

  it('overwrites a previous cache entry for the same key', () => {
    const first = makeWeatherResponse({ temperatureF: 60 })
    const second = makeWeatherResponse({ temperatureF: 75 })
    const t1 = 1_000
    const t2 = 2_000

    setCachedWeather('weather:update', first, t1)
    setCachedWeather('weather:update', second, t2)

    const cached = getCachedWeather('weather:update')
    expect(cached!.data.temperatureF).toBe(75)
    expect(cached!.timestamp).toBe(t2)
  })

  it('preserves all WeatherResponse fields', () => {
    const data = makeWeatherResponse()
    setCachedWeather('weather:full', data, 0)

    const cached = getCachedWeather('weather:full')
    expect(cached!.data.location).toBe(data.location)
    expect(cached!.data.temperatureF).toBe(data.temperatureF)
    expect(cached!.data.temperatureC).toBe(data.temperatureC)
    expect(cached!.data.condition).toBe(data.condition)
    expect(cached!.data.iconCode).toBe(data.iconCode)
    expect(cached!.data.humidity).toBe(data.humidity)
    expect(cached!.data.windSpeedMph).toBe(data.windSpeedMph)
    expect(cached!.data.observedAt).toBe(data.observedAt)
  })
})
