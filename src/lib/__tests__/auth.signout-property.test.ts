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

jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}))

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
  })),
}))

jest.mock('../amplify', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}))

/**
 * We mock the storage module directly so we can track whether clear() is
 * called and simulate seeded data via a simple in-memory store.
 */
const mockStore = new Map<string, string>()

jest.mock('../storage', () => ({
  get: jest.fn((key: string) => {
    const raw = mockStore.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }),
  set: jest.fn((key: string, value: unknown) => {
    mockStore.set(key, JSON.stringify(value))
  }),
  deleteKey: jest.fn((key: string) => {
    mockStore.delete(key)
  }),
  clear: jest.fn(() => {
    mockStore.clear()
  }),
}))

let mockMutationQueueCleared = false
jest.mock('../mutationQueueClear', () => ({
  clearMutationQueue: jest.fn(async () => {
    mockMutationQueueCleared = true
  }),
}))

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
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
  .integer({ min: 10000, max: 99999 })
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
  mockStore.clear()
  mockMutationQueueCleared = false
})

// ---------------------------------------------------------------------------
// Property 17: Sign-Out Cache Clearing
// **Validates: Requirements 7.5**
// ---------------------------------------------------------------------------

describe('Property 17: Sign-Out Cache Clearing', () => {
  it('for any arbitrary set of cached data, after signOut() completes, ALL MMKV storage is cleared', async () => {
    await fc.assert(
      fc.asyncProperty(cachedDataArb, async (cachedEntries) => {
        // Seed the mock store with arbitrary cached data
        for (const [key, value] of cachedEntries) {
          mockStore.set(key, value)
        }

        // Verify data was seeded (if any entries provided)
        if (cachedEntries.length > 0) {
          expect(mockStore.size).toBeGreaterThan(0)
        }

        // Execute sign-out
        await signOut()

        // After sign-out, storage must be completely empty
        expect(mockStore.size).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('no user-specific data remains in MMKV after sign-out regardless of data types cached', async () => {
    await fc.assert(
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
            mockStore.set(key, value)
          }

          await signOut()

          // No keys should remain — no plant, garden, event, or weather data
          expect(mockStore.size).toBe(0)

          // Specifically verify no user-specific keys survive
          for (const [key] of allEntries) {
            expect(mockStore.has(key)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SQLite mutation queue is cleared after signOut() regardless of cached MMKV state', async () => {
    await fc.assert(
      fc.asyncProperty(cachedDataArb, async (cachedEntries) => {
        // Seed storage with arbitrary data
        for (const [key, value] of cachedEntries) {
          mockStore.set(key, value)
        }
        mockMutationQueueCleared = false

        await signOut()

        // The mutation queue clear must always be called
        expect(mockMutationQueueCleared).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('signOut() clears all caches regardless of the volume of cached data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (entryCount) => {
          // Seed storage with a variable number of entries
          for (let i = 0; i < entryCount; i++) {
            mockStore.set(`data:${i}`, JSON.stringify({ index: i, payload: 'x'.repeat(i) }))
          }

          expect(mockStore.size).toBe(entryCount)

          await signOut()

          // All entries must be cleared regardless of count
          expect(mockStore.size).toBe(0)
          expect(mockMutationQueueCleared).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
