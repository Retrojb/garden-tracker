/**
 * Unit tests for the usePlants hook.
 *
 * Covers:
 *  1. createPlant adds to list (online)
 *  2. updatePlant modifies existing plant (online)
 *  3. deletePlant removes from list (online)
 *  4. updatePlant throws when plant is pending-delete (Req 1.10)
 *  5. Offline mode serves from cache
 *  6. Offline mode enqueues mutations (create)
 *  7. Offline mode enqueues mutations (update)
 *  8. Offline mode enqueues mutations (delete)
 *  9. refreshPlants fetches and sets the plants list (online)
 * 10. error state is set when API call fails
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('@/src/lib/mutationQueue', () => ({
  enqueue: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/src/lib/storage', () => ({
  get: jest.fn(),
  set: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import { enqueue } from '@/src/lib/mutationQueue'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type {
    ICreatePlantPayload,
    IUpdatePlantPayload,
} from '@/src/types/TPayload'
import type { IPlant } from '@/src/types/TPlant'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { _setIsOnlineImpl, usePlants } from '../usePlants'

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

const PLANT_A: IPlant = {
  id: 'plant-1',
  name: 'Tomato',
  species: 'Solanum lycopersicum',
  variety: 'Roma',
  gardenId: 'garden-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const PLANT_B: IPlant = {
  id: 'plant-2',
  name: 'Basil',
  species: 'Ocimum basilicum',
  variety: 'Sweet',
  gardenId: 'garden-1',
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
}

const CREATE_PAYLOAD: ICreatePlantPayload = {
  name: 'Pepper',
  species: 'Capsicum annuum',
  variety: 'Bell',
}

const CREATED_PLANT: IPlant = {
  id: 'plant-3',
  name: 'Pepper',
  species: 'Capsicum annuum',
  variety: 'Bell',
  gardenId: 'garden-1',
  createdAt: '2024-01-03T00:00:00.000Z',
  updatedAt: '2024-01-03T00:00:00.000Z',
}

const UPDATE_PAYLOAD: IUpdatePlantPayload = { name: 'Cherry Tomato' }

const UPDATED_PLANT: IPlant = {
  ...PLANT_A,
  name: 'Cherry Tomato',
  updatedAt: '2024-01-04T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  _setIsOnlineImpl(async () => true)
  mockStorageGet.mockReturnValue(null)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePlants', () => {
  // -------------------------------------------------------------------------
  // 9. refreshPlants fetches and sets the plants list (online)
  // -------------------------------------------------------------------------
  it('refreshPlants fetches plants from the API and sets state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PLANT_A, PLANT_B],
      status: 200,
    })

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/plants')
    expect(result.current.plants).toEqual([PLANT_A, PLANT_B])
    expect(result.current.error).toBeNull()
    expect(mockStorageSet).toHaveBeenCalledWith('plants_cache', [
      PLANT_A,
      PLANT_B,
    ])
  })

  // -------------------------------------------------------------------------
  // 1. createPlant adds to list (online)
  // -------------------------------------------------------------------------
  it('createPlant appends the new plant to state when online', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [PLANT_A], status: 200 })
    mockApiPost.mockResolvedValueOnce({ data: CREATED_PLANT, status: 201 })

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: IPlant | undefined
    await act(async () => {
      created = await result.current.createPlant(CREATE_PAYLOAD)
    })

    expect(mockApiPost).toHaveBeenCalledWith('/plants', CREATE_PAYLOAD)
    expect(created).toEqual(CREATED_PLANT)
    expect(result.current.plants).toContainEqual(CREATED_PLANT)
    expect(result.current.plants).toHaveLength(2)
  })

  // -------------------------------------------------------------------------
  // 2. updatePlant modifies existing plant (online)
  // -------------------------------------------------------------------------
  it('updatePlant updates the matching plant in state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PLANT_A, PLANT_B],
      status: 200,
    })
    mockApiPut.mockResolvedValueOnce({ data: UPDATED_PLANT, status: 200 })

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: IPlant | undefined
    await act(async () => {
      updated = await result.current.updatePlant(PLANT_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).toHaveBeenCalledWith(
      `/plants/${PLANT_A.id}`,
      UPDATE_PAYLOAD
    )
    expect(updated).toEqual(UPDATED_PLANT)
    const inState = result.current.plants.find((p) => p.id === PLANT_A.id)
    expect(inState?.name).toBe('Cherry Tomato')
    expect(result.current.plants).toContainEqual(PLANT_B)
  })

  // -------------------------------------------------------------------------
  // 3. deletePlant removes from list (online)
  // -------------------------------------------------------------------------
  it('deletePlant removes the plant from state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PLANT_A, PLANT_B],
      status: 200,
    })
    mockApiDelete.mockResolvedValueOnce({ data: {}, status: 200 })

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deletePlant(PLANT_A.id)
    })

    expect(mockApiDelete).toHaveBeenCalledWith(`/plants/${PLANT_A.id}`)
    expect(result.current.plants).not.toContainEqual(PLANT_A)
    expect(result.current.plants).toContainEqual(PLANT_B)
    expect(result.current.plants).toHaveLength(1)
  })

  // -------------------------------------------------------------------------
  // 4. updatePlant throws when plant is pending-delete (Req 1.10)
  // -------------------------------------------------------------------------
  it('updatePlant throws when plant is pending-delete', async () => {
    // Set up: make the delete call hang so the plant stays in pendingDeletes
    mockApiGet.mockResolvedValueOnce({
      data: [PLANT_A, PLANT_B],
      status: 200,
    })
    // The delete call will never resolve during this test
    mockApiDelete.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Start a delete (it will hang, keeping plant in pendingDeletes)
    act(() => {
      void result.current.deletePlant(PLANT_A.id)
    })

    // Now try to update the same plant — should throw
    await act(async () => {
      await expect(
        result.current.updatePlant(PLANT_A.id, UPDATE_PAYLOAD)
      ).rejects.toThrow('Cannot update plant "plant-1": delete is in progress')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toContain('delete is in progress')
  })

  // -------------------------------------------------------------------------
  // 5. Offline mode serves from cache
  // -------------------------------------------------------------------------
  it('refreshPlants serves from MMKV cache when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([PLANT_A])

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).not.toHaveBeenCalled()
    expect(result.current.plants).toEqual([PLANT_A])
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 6. Offline mode enqueues mutations (create)
  // -------------------------------------------------------------------------
  it('createPlant enqueues mutation and returns optimistic plant when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([PLANT_A])

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: IPlant | undefined
    await act(async () => {
      created = await result.current.createPlant(CREATE_PAYLOAD)
    })

    expect(mockApiPost).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'create',
      resource: '/plants',
      payload: CREATE_PAYLOAD,
    })
    expect(created).toBeDefined()
    expect(created?.name).toBe(CREATE_PAYLOAD.name)
    expect(created?.species).toBe(CREATE_PAYLOAD.species)
    expect(created?.id).toBeDefined()
    expect(
      result.current.plants.some((p) => p.name === CREATE_PAYLOAD.name)
    ).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 7. Offline mode enqueues mutations (update)
  // -------------------------------------------------------------------------
  it('updatePlant enqueues mutation and applies optimistic update when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([PLANT_A, PLANT_B])

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: IPlant | undefined
    await act(async () => {
      updated = await result.current.updatePlant(PLANT_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'update',
      resource: `/plants/${PLANT_A.id}`,
      payload: UPDATE_PAYLOAD,
    })
    expect(updated?.name).toBe('Cherry Tomato')
    const inState = result.current.plants.find((p) => p.id === PLANT_A.id)
    expect(inState?.name).toBe('Cherry Tomato')
  })

  // -------------------------------------------------------------------------
  // 8. Offline mode enqueues mutations (delete)
  // -------------------------------------------------------------------------
  it('deletePlant enqueues mutation and removes plant optimistically when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([PLANT_A, PLANT_B])

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deletePlant(PLANT_A.id)
    })

    expect(mockApiDelete).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'delete',
      resource: `/plants/${PLANT_A.id}`,
      payload: null,
    })
    expect(result.current.plants).not.toContainEqual(PLANT_A)
    expect(result.current.plants).toContainEqual(PLANT_B)
  })

  // -------------------------------------------------------------------------
  // 10. error state is set when API call fails
  // -------------------------------------------------------------------------
  it('sets error state when refreshPlants API call fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Server error')
    expect(result.current.plants).toBeDefined()
  })

  it('sets error state when createPlant API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockApiPost.mockRejectedValueOnce(new Error('Create failed'))

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.createPlant(CREATE_PAYLOAD)).rejects.toThrow(
        'Create failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Create failed')
  })

  it('sets error state when deletePlant API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [PLANT_A], status: 200 })
    mockApiDelete.mockRejectedValueOnce(new Error('Delete failed'))

    const { result } = renderHook(() => usePlants())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.deletePlant(PLANT_A.id)).rejects.toThrow(
        'Delete failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Delete failed')
  })
})
