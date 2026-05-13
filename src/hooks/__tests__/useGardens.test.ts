/**
 * Unit tests for the useGardens hook.
 *
 * Covers:
 *  1. refreshGardens fetches and sets the gardens list (online)
 *  2. refreshGardens serves from MMKV cache when offline (Req 8.1)
 *  3. createGarden appends a new garden to state (online)
 *  4. createGarden enqueues mutation and returns optimistic record when offline (Req 8.2)
 *  5. updateGarden updates the matching garden in state (online)
 *  6. updateGarden enqueues mutation and applies optimistic update when offline (Req 8.2)
 *  7. deleteGarden removes the garden from state (online)
 *  8. deleteGarden enqueues mutation and removes optimistically when offline (Req 8.2)
 *  9. error state is set when refreshGardens API call fails (Req 9.3)
 * 10. error state is set when createGarden API call fails (Req 9.3)
 * 11. error state is set when updateGarden API call fails (Req 9.3)
 * 12. error state is set when deleteGarden API call fails (Req 9.3)
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

// Mock apiClient
jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock mutationQueue
jest.mock('@/src/lib/mutationQueue', () => ({
  enqueue: jest.fn().mockResolvedValue(undefined),
}))

// Mock storage (MMKV helpers)
jest.mock('@/src/lib/storage', () => ({
  get: jest.fn(),
  set: jest.fn(),
}))

// react-native-mmkv is already mapped to the in-memory mock via jest.config.js

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import { enqueue } from '@/src/lib/mutationQueue'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { IGarden } from '@/src/types/TGarden'
import type {
  ICreateGardenPayload,
  IUpdateGardenPayload,
} from '@/src/types/TPayload'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as fc from 'fast-check'
import { _setIsOnlineImpl, useGardens } from '../useGardens'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>
const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>
const mockApiPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>
const mockApiDelete = apiClient.delete as jest.MockedFunction<
  typeof apiClient.delete
>
const mockEnqueue = enqueue as jest.MockedFunction<typeof enqueue>
const mockStorageGet = storageGet as jest.MockedFunction<typeof storageGet>
const mockStorageSet = storageSet as jest.MockedFunction<typeof storageSet>

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GARDEN_A: IGarden = {
  id: 'garden-1',
  name: 'Tomato Bed',
  type: 'raised_bed',
  size: '4x8 ft',
  dimensions: { widthInches: 48, heightInches: 96 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const GARDEN_B: IGarden = {
  id: 'garden-2',
  name: 'Herb Container',
  type: 'container',
  size: '2x2 ft',
  dimensions: { widthInches: 24, heightInches: 24 },
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
}

const CREATE_PAYLOAD: ICreateGardenPayload = {
  name: 'New Garden',
  type: 'in_ground',
  dimensions: { widthInches: 60, heightInches: 120 },
}

const CREATED_GARDEN: IGarden = {
  id: 'garden-3',
  name: 'New Garden',
  type: 'in_ground',
  size: '5x10 ft',
  dimensions: { widthInches: 60, heightInches: 120 },
  createdAt: '2024-01-03T00:00:00.000Z',
  updatedAt: '2024-01-03T00:00:00.000Z',
}

const UPDATE_PAYLOAD: IUpdateGardenPayload = { name: 'Updated Tomato Bed' }

const UPDATED_GARDEN: IGarden = {
  ...GARDEN_A,
  name: 'Updated Tomato Bed',
  updatedAt: '2024-01-04T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store between tests by re-importing the module */
const resetStore = (): void => {
  jest.resetModules()
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  // Default: device is online
  _setIsOnlineImpl(async () => true)
  // Default: storage returns null (no cache)
  mockStorageGet.mockReturnValue(null)
})

afterEach(() => {
  resetStore()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGardens', () => {
  // -------------------------------------------------------------------------
  // 1. refreshGardens fetches and sets the gardens list (online)
  // -------------------------------------------------------------------------
  it('refreshGardens fetches gardens from the API and sets state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [GARDEN_A, GARDEN_B],
      status: 200,
    })

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/gardens')
    expect(result.current.gardens).toEqual([GARDEN_A, GARDEN_B])
    expect(result.current.error).toBeNull()
    // Should persist to cache
    expect(mockStorageSet).toHaveBeenCalledWith('gardens_cache', [
      GARDEN_A,
      GARDEN_B,
    ])
  })

  // -------------------------------------------------------------------------
  // 2. refreshGardens serves from MMKV cache when offline (Req 8.1)
  // -------------------------------------------------------------------------
  it('refreshGardens serves from MMKV cache when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([GARDEN_A])

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).not.toHaveBeenCalled()
    expect(result.current.gardens).toEqual([GARDEN_A])
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 3. createGarden appends a new garden to state (online)
  // -------------------------------------------------------------------------
  it('createGarden appends the new garden to state when online', async () => {
    // Initial load returns existing gardens
    mockApiGet.mockResolvedValueOnce({ data: [GARDEN_A], status: 200 })
    mockApiPost.mockResolvedValueOnce({ data: CREATED_GARDEN, status: 201 })

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: IGarden | undefined
    await act(async () => {
      created = await result.current.createGarden(CREATE_PAYLOAD)
    })

    expect(mockApiPost).toHaveBeenCalledWith('/gardens', CREATE_PAYLOAD)
    expect(created).toEqual(CREATED_GARDEN)
    expect(result.current.gardens).toContainEqual(CREATED_GARDEN)
    expect(result.current.gardens).toHaveLength(2)
  })

  // -------------------------------------------------------------------------
  // 4. createGarden enqueues mutation and returns optimistic record when offline
  // -------------------------------------------------------------------------
  it('createGarden enqueues mutation and returns an optimistic garden when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([GARDEN_A])

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: IGarden | undefined
    await act(async () => {
      created = await result.current.createGarden(CREATE_PAYLOAD)
    })

    // Should NOT call the API
    expect(mockApiPost).not.toHaveBeenCalled()
    // Should enqueue the mutation
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'create',
      resource: '/gardens',
      payload: CREATE_PAYLOAD,
    })
    // Optimistic record should be returned and appended
    expect(created).toBeDefined()
    expect(created?.name).toBe(CREATE_PAYLOAD.name)
    expect(created?.type).toBe(CREATE_PAYLOAD.type)
    expect(created?.id).toBeDefined()
    expect(
      result.current.gardens.some((g) => g.name === CREATE_PAYLOAD.name)
    ).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 5. updateGarden updates the matching garden in state (online)
  // -------------------------------------------------------------------------
  it('updateGarden updates the matching garden in state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [GARDEN_A, GARDEN_B],
      status: 200,
    })
    mockApiPut.mockResolvedValueOnce({ data: UPDATED_GARDEN, status: 200 })

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: IGarden | undefined
    await act(async () => {
      updated = await result.current.updateGarden(GARDEN_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).toHaveBeenCalledWith(
      `/gardens/${GARDEN_A.id}`,
      UPDATE_PAYLOAD
    )
    expect(updated).toEqual(UPDATED_GARDEN)
    // The updated garden should replace the original in the list
    const inState = result.current.gardens.find((g) => g.id === GARDEN_A.id)
    expect(inState?.name).toBe('Updated Tomato Bed')
    // Other gardens remain unchanged
    expect(result.current.gardens).toContainEqual(GARDEN_B)
  })

  // -------------------------------------------------------------------------
  // 6. updateGarden enqueues mutation and applies optimistic update when offline
  // -------------------------------------------------------------------------
  it('updateGarden enqueues mutation and applies optimistic update when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([GARDEN_A, GARDEN_B])

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: IGarden | undefined
    await act(async () => {
      updated = await result.current.updateGarden(GARDEN_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'update',
      resource: `/gardens/${GARDEN_A.id}`,
      payload: UPDATE_PAYLOAD,
    })
    expect(updated?.name).toBe('Updated Tomato Bed')
    const inState = result.current.gardens.find((g) => g.id === GARDEN_A.id)
    expect(inState?.name).toBe('Updated Tomato Bed')
  })

  // -------------------------------------------------------------------------
  // 7. deleteGarden removes the garden from state (online)
  // -------------------------------------------------------------------------
  it('deleteGarden removes the garden from state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [GARDEN_A, GARDEN_B],
      status: 200,
    })
    mockApiDelete.mockResolvedValueOnce({ data: {}, status: 200 })

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteGarden(GARDEN_A.id)
    })

    expect(mockApiDelete).toHaveBeenCalledWith(`/gardens/${GARDEN_A.id}`)
    expect(result.current.gardens).not.toContainEqual(GARDEN_A)
    expect(result.current.gardens).toContainEqual(GARDEN_B)
    expect(result.current.gardens).toHaveLength(1)
  })

  // -------------------------------------------------------------------------
  // 8. deleteGarden enqueues mutation and removes optimistically when offline
  // -------------------------------------------------------------------------
  it('deleteGarden enqueues mutation and removes garden optimistically when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([GARDEN_A, GARDEN_B])

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteGarden(GARDEN_A.id)
    })

    expect(mockApiDelete).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'delete',
      resource: `/gardens/${GARDEN_A.id}`,
      payload: null,
    })
    expect(result.current.gardens).not.toContainEqual(GARDEN_A)
    expect(result.current.gardens).toContainEqual(GARDEN_B)
  })

  // -------------------------------------------------------------------------
  // 9. error state is set when refreshGardens API call fails (Req 9.3)
  // -------------------------------------------------------------------------
  it('sets error state when refreshGardens API call fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Server error')
    // Hook must not crash — other state remains accessible
    expect(result.current.gardens).toBeDefined()
    expect(result.current.isLoading).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 10. error state is set when createGarden API call fails (Req 9.3)
  // -------------------------------------------------------------------------
  it('sets error state when createGarden API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockApiPost.mockRejectedValueOnce(new Error('Create failed'))

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.createGarden(CREATE_PAYLOAD)).rejects.toThrow(
        'Create failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Create failed')
    // Hook must not crash
    expect(result.current.gardens).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 11. error state is set when updateGarden API call fails (Req 9.3)
  // -------------------------------------------------------------------------
  it('sets error state when updateGarden API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [GARDEN_A], status: 200 })
    mockApiPut.mockRejectedValueOnce(new Error('Update failed'))

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(
        result.current.updateGarden(GARDEN_A.id, UPDATE_PAYLOAD)
      ).rejects.toThrow('Update failed')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Update failed')
    expect(result.current.gardens).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 12. error state is set when deleteGarden API call fails (Req 9.3)
  // -------------------------------------------------------------------------
  it('sets error state when deleteGarden API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [GARDEN_A], status: 200 })
    mockApiDelete.mockRejectedValueOnce(new Error('Delete failed'))

    const { result } = renderHook(() => useGardens())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.deleteGarden(GARDEN_A.id)).rejects.toThrow(
        'Delete failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Delete failed')
    expect(result.current.gardens).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid TGardenType value.
 */
const gardenTypeArb = fc.constantFrom(
  'raised_bed' as const,
  'in_ground' as const,
  'container' as const,
  'greenhouse' as const,
  'other' as const
)

/**
 * Generates a valid IUpdateGardenPayload.
 * All fields are optional — we generate at least one field to ensure the
 * payload is non-trivial, covering the full update surface.
 */
const updateGardenPayloadArb: fc.Arbitrary<IUpdateGardenPayload> = fc.record(
  {
    name: fc.option(
      fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
    type: fc.option(gardenTypeArb, { nil: undefined }),
    dimensions: fc.option(
      fc.record({
        widthInches: fc.integer({ min: 1, max: 1200 }),
        heightInches: fc.integer({ min: 1, max: 1200 }),
      }),
      { nil: undefined }
    ),
  },
  { requiredKeys: [] }
)

// ---------------------------------------------------------------------------
// Property 8: CRUD Idempotency
//
// Calling updateGarden with the same payload twice produces the same final
// garden state as calling it once.
//
// Validates: Requirements 2.9
// ---------------------------------------------------------------------------

describe('Property 8: CRUD Idempotency', () => {
  /**
   * Shared garden fixture used as the pre-existing record in the store.
   * Defined here so both sub-tests reference the same base object.
   */
  const BASE_GARDEN: IGarden = {
    id: 'idempotency-garden-1',
    name: 'Base Garden',
    type: 'raised_bed',
    size: '4x8 ft',
    dimensions: { widthInches: 48, heightInches: 96 },
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    _setIsOnlineImpl(async () => true)
    mockStorageGet.mockReturnValue(null)
  })

  /**
   * Helper: builds the IGarden the API would return after applying
   * `payload` to `base`.  Mirrors the hook's in-place merge logic so the
   * mock response is realistic.
   */
  const buildUpdatedGarden = (
    base: IGarden,
    payload: IUpdateGardenPayload
  ): IGarden => ({
    ...base,
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.dimensions !== undefined
      ? { dimensions: payload.dimensions }
      : {}),
    updatedAt: '2024-06-02T00:00:00.000Z',
  })

  it('gardens array state after one update equals state after two identical updates', async () => {
    await fc.assert(
      fc.asyncProperty(updateGardenPayloadArb, async (payload) => {
        // ----------------------------------------------------------------
        // Single-update scenario
        // ----------------------------------------------------------------
        const afterOneUpdate = buildUpdatedGarden(BASE_GARDEN, payload)

        mockApiGet.mockResolvedValue({ data: [BASE_GARDEN], status: 200 })
        // First (and only) update call
        mockApiPut.mockResolvedValueOnce({ data: afterOneUpdate, status: 200 })

        const { result: resultOne, unmount: unmountOne } = renderHook(() =>
          useGardens()
        )

        await waitFor(() => expect(resultOne.current.isLoading).toBe(false))

        await act(async () => {
          await resultOne.current.updateGarden(BASE_GARDEN.id, payload)
        })

        const gardensAfterOne = [...resultOne.current.gardens]
        unmountOne()

        // ----------------------------------------------------------------
        // Double-update scenario — same payload applied twice
        // ----------------------------------------------------------------
        // The API is idempotent: both PUT calls return the same result
        mockApiGet.mockResolvedValue({ data: [BASE_GARDEN], status: 200 })
        mockApiPut
          .mockResolvedValueOnce({ data: afterOneUpdate, status: 200 })
          .mockResolvedValueOnce({ data: afterOneUpdate, status: 200 })

        const { result: resultTwo, unmount: unmountTwo } = renderHook(() =>
          useGardens()
        )

        await waitFor(() => expect(resultTwo.current.isLoading).toBe(false))

        await act(async () => {
          await resultTwo.current.updateGarden(BASE_GARDEN.id, payload)
          await resultTwo.current.updateGarden(BASE_GARDEN.id, payload)
        })

        const gardensAfterTwo = [...resultTwo.current.gardens]
        unmountTwo()

        // ----------------------------------------------------------------
        // Assertion: final gardens arrays are structurally identical
        // ----------------------------------------------------------------
        expect(gardensAfterTwo).toEqual(gardensAfterOne)
      }),
      { numRuns: 50 }
    )
  })

  it('returned Garden object from second update is structurally equivalent to the first', async () => {
    await fc.assert(
      fc.asyncProperty(updateGardenPayloadArb, async (payload) => {
        const afterUpdate = buildUpdatedGarden(BASE_GARDEN, payload)

        mockApiGet.mockResolvedValue({ data: [BASE_GARDEN], status: 200 })
        mockApiPut
          .mockResolvedValueOnce({ data: afterUpdate, status: 200 })
          .mockResolvedValueOnce({ data: afterUpdate, status: 200 })

        const { result, unmount } = renderHook(() => useGardens())

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let firstResult: IGarden | undefined
        let secondResult: IGarden | undefined

        await act(async () => {
          firstResult = await result.current.updateGarden(
            BASE_GARDEN.id,
            payload
          )
          secondResult = await result.current.updateGarden(
            BASE_GARDEN.id,
            payload
          )
        })

        unmount()

        // Both calls must return structurally equivalent Garden objects
        expect(secondResult).toEqual(firstResult)
      }),
      { numRuns: 50 }
    )
  })
})
