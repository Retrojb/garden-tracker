/**
 * Property-Based Tests for usePlants hook
 *
 * Property 4: Garden ID filtering returns only matching plants
 *
 * For any collection of plants with various gardenId values, calling
 * `usePlants(targetId)` shall return only plants whose `gardenId` field
 * equals `targetId`, and no others.
 *
 * **Validates: Requirements 3.1, 4.2**
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

jest.mock('@/src/lib/storage', () => ({
  get: jest.fn(),
  set: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import { get as storageGet } from '@/src/lib/storage'
import type { IPlant } from '@/src/types/TPlant'
import { renderHook, waitFor } from '@testing-library/react-native'
import * as fc from 'fast-check'
import { usePlants } from '../usePlants'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>
const mockStorageGet = storageGet as jest.MockedFunction<typeof storageGet>

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid gardenId string (non-empty UUID-like identifier).
 */
const gardenIdArb = fc.stringMatching(/^[a-z0-9-]{1,36}$/)

/**
 * Generates a valid IPlant object with a given gardenId.
 */
const plantWithGardenIdArb = (gardenId: fc.Arbitrary<string>): fc.Arbitrary<IPlant> =>
  fc.record({
    id: fc.uuid(),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    species: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    variety: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    gardenId: gardenId,
    createdAt: fc.date().map((d) => d.toISOString()),
    updatedAt: fc.date().map((d) => d.toISOString()),
  })

/**
 * Generates an array of plants with various gardenId values, ensuring at least
 * two distinct gardenIds exist so filtering is meaningful.
 */
const plantsWithMultipleGardensArb = fc
  .tuple(
    gardenIdArb,
    fc.array(gardenIdArb, { minLength: 1, maxLength: 5 })
  )
  .chain(([targetId, otherIds]) => {
    const allIds = [targetId, ...otherIds.filter((id) => id !== targetId)]
    // Ensure we have at least one other ID distinct from targetId
    const distinctOtherIds = allIds.length > 1 ? allIds.slice(1) : ['other-garden-id']

    return fc.tuple(
      fc.constant(targetId),
      fc.array(
        plantWithGardenIdArb(fc.constantFrom(targetId, ...distinctOtherIds)),
        { minLength: 1, maxLength: 20 }
      )
    )
  })

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockStorageGet.mockReturnValue(null)
})

// ---------------------------------------------------------------------------
// Property 4: Garden ID filtering returns only matching plants
// ---------------------------------------------------------------------------

describe('Property 4: Garden ID filtering returns only matching plants', () => {
  it('usePlants(targetId) returns only plants whose gardenId === targetId', async () => {
    await fc.assert(
      fc.asyncProperty(
        plantsWithMultipleGardensArb,
        async ([targetId, allPlants]) => {
          jest.clearAllMocks()
          mockStorageGet.mockReturnValue(null)

          // The API returns all plants (simulating a response that includes
          // plants from multiple gardens)
          mockApiGet.mockResolvedValueOnce({
            data: allPlants,
            status: 200,
          })

          const { result, unmount } = renderHook(() => usePlants(targetId))

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          const returnedPlants = result.current.plants

          // Every returned plant must have gardenId === targetId
          for (const plant of returnedPlants) {
            expect(plant.gardenId).toBe(targetId)
          }

          // The count of returned plants must equal the count of plants
          // in the input that match the targetId
          const expectedCount = allPlants.filter(
            (p) => p.gardenId === targetId
          ).length
          expect(returnedPlants).toHaveLength(expectedCount)

          // No plant with a different gardenId should be present
          const nonMatchingPlants = returnedPlants.filter(
            (p) => p.gardenId !== targetId
          )
          expect(nonMatchingPlants).toHaveLength(0)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
