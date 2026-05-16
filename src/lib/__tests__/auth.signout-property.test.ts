/**
 * Property-Based Tests: Sign-Out Cache Clearing
 *
 * **Property 17: Sign-Out Cache Clearing** — after `signOut()`, local cache
 * must be empty; no user-specific data remains.
 *
 * **Validates: Requirements 7.5**
 */

import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchAuthSession = jest.fn()
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}))

const mockAmplifySignOut = jest.fn()
jest.mock('../amplify', () => ({
  signOut: () => mockAmplifySignOut(),
}))

/**
 * We need direct access to the MMKV instance to seed data before sign-out.
 * Import the mock class and create a shared instance that mirrors what
 * storage.ts uses internally.
 */
const mockMMKVInstance = {
  store: new Map<string, string>(),
  getString(key: string): string | undefined {
    return this.store.get(key)
  },
  set(key: string, value: string): void {
    this.store.set(key, value)
  },
  delete(key: string): void {
    this.store.delete(key)
  },
  clearAll(): void {
    this.store.clear()
  },
  contains(key: string): boolean {
    return this.store.has(key)
  },
  getAllKeys(): string[] {
    return Array.from(this.store.keys())
  },
}

jest.mock('../../__mocks__/react-native-mmkv', () => ({
  MMKV: jest.fn(() => mockMMKVInstance),
}))

let mutationQueueCleared = false
jest.mock('../mutationQueueClear', () => ({
  clearMutationQueue: jest.fn(async () => {
    mutationQueueCleared = true
  }),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { signOut } from '../auth'

// ---------------------------------------------------------------------------
// Arbitraries — smart generators for cached data
// ---------------------------------------------------------------------------

/** Generates a storage key representing cached plant data */
const plantKeyArb = fc
  .uuid()
  .map((id) => `plant:${id}`)

/** Generates a storage key representing cached garden data */
const gardenKeyArb = fc
  .uuid()
  .map((id) => `garden:${id}`)

/** Generates a storage key representing cached calendar events */
const eventKeyArb = fc
  .uuid()
  .map((id) => `event:${id}`)

/** Generates a storage key representing cached weather data */
const weatherKeyArb = fc
  .string({ minLength: 5, maxLength: 5, unit: 'grapheme' })
  .filter((s) => /^\d{5}$/.test(s))
  .map((zip) => `weather:${zip}`)

/** Generates an arbitrary MMKV storage key (any user-specific data) */
const storageKeyArb = fc.oneof(
  plantKeyArb,
  gardenKeyArb,
  eventKeyArb,
  weatherKeyArb,
  fc.string({ minLength: 1, maxLength: 50 }).map((k) => `user:${k}`)
)

/** Generates a JSON-serializable value to store */
const storageValueArb = fc.oneof(
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    species: fc.string({ minLength: 1, maxLength: 100 }),
  }).map((v) => JSON.stringify(v)),
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom('raised_bed', 'in_ground', 'container'),
    dimensions: fc.record({
      widthInches: fc.integer({ min: 1, max: 1200 }),
      heightInches: fc.integer({ min: 1, max: 1200 }),
    }),
  }).map((v) => JSON.stringify(v)),
  fc.record({
    data: fc.record({
      location: fc.string({ minLength: 1, maxLength: 50 }),
      temperatureF: fc.float({ min: -50, max: 130, noNaN: true }),
      condition: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    timestamp: fc.integer({ min: 0, max: Date.now() }),
  }).map((v) => JSON.stringify(v))
)

/** Generates a set of key-value pairs representing cached user data */
const cachedDataArb = fc.array(
  fc.tuple(storageKeyArb, storageValueArb),
  { minLength: 0, maxLength: 20 }
)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockMMKVInstance.store.clear()
  mutationQueueCleared = false
  mockAmplifySignOut.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Property 17: Sign-Out Cache Clearing
// **Validates: Requirements 7.5**
// ---------------------------------------------------------------------------

describe('Property 17: Sign-Out Cache Clearing', () => {
  it('for any arbitrary set of cached data, after signOut() completes, ALL MMKV storage is cleared', () => {
    fc.assert(
      fc.asyncProperty(cachedDataArb, async (cachedEntries) => {
        // Seed MMKV with arbitrary cached data
        for (const [key, value] of cachedEntries) {
          mockMMKVInstance.set(key, value)
        }

        // Verify data was seeded (if any entries provided)
        if (cachedEntries.length > 0) {
          expect(mockMMKVInstance.getAllKeys().length).toBeGreaterThan(0)
        }

        // Execute sign-out
        await signOut()

        // After sign-out, MMKV must be completely empty
        expect(mockMMKVInstance.getAllKeys()).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  it('no user-specific data remains in MMKV after sign-out regardless of data types cached', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          plants: fc.array(fc.tuple(plantKeyArb, storageValueArb), { minLength: 0, maxLength: 5 }),
          gardens: fc.array(fc.tuple(gardenKeyArb, storageValueArb), { minLength: 0, maxLength: 5 }),
          events: fc.array(fc.tuple(eventKeyArb, storageValueArb), { minLength: 0, maxLength: 5 }),
          weather: fc.array(fc.tuple(weatherKeyArb, storageValueArb), { minLength: 0, maxLength: 3 }),
        }),
        async ({ plants, gardens, events, weather }) => {
          // Seed all categories of user data
          const allEntries = [...plants, ...gardens, ...events, ...weather]
          for (const [key, value] of allEntries) {
            mockMMKVInstance.set(key, value)
          }

          await signOut()

          // No keys should remain — no plant, garden, event, or weather data
          const remainingKeys = mockMMKVInstance.getAllKeys()
          expect(remainingKeys).toHaveLength(0)

          // Specifically verify no user-specific keys survive
          for (const [key] of allEntries) {
            expect(mockMMKVInstance.contains(key)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SQLite mutation queue is cleared after signOut() regardless of cached MMKV state', () => {
    fc.assert(
      fc.asyncProperty(cachedDataArb, async (cachedEntries) => {
        // Seed MMKV with arbitrary data
        for (const [key, value] of cachedEntries) {
          mockMMKVInstance.set(key, value)
        }
        mutationQueueCleared = false

        await signOut()

        // The mutation queue clear must always be called
        expect(mutationQueueCleared).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('signOut() clears all caches regardless of the volume of cached data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (entryCount) => {
          // Seed MMKV with a variable number of entries
          for (let i = 0; i < entryCount; i++) {
            mockMMKVInstance.set(`data:${i}`, JSON.stringify({ index: i, payload: 'x'.repeat(i) }))
          }

          expect(mockMMKVInstance.getAllKeys().length).toBe(entryCount)

          await signOut()

          // All entries must be cleared regardless of count
          expect(mockMMKVInstance.getAllKeys()).toHaveLength(0)
          expect(mutationQueueCleared).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
