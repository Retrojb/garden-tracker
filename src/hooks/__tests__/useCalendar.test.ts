/**
 * Unit tests for the useCalendar hook.
 *
 * Covers:
 *  1. refreshEvents fetches and sets the events list (online)
 *  2. createEvent adds to list (online) — Req 4.1
 *  3. updateEvent modifies existing event (online) — Req 4.3
 *  4. deleteEvent removes from list (online) — Req 4.4
 *  5. Events are filtered by plantId when provided — Req 4.2
 *  6. Orphaned events (plant deleted) are hidden from views — Req 4.6
 *  7. Offline mode serves from cache
 *  8. Offline mode enqueues mutations (create)
 *  9. Offline mode enqueues mutations (update)
 * 10. Offline mode enqueues mutations (delete)
 * 11. Error state is set when API call fails — Req 9.3
 * 12. All event types are supported — Req 4.5
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

// Mock usePlants to provide the plants list for orphan detection
const mockPlants = jest.fn()
jest.mock('../usePlants', () => ({
  usePlants: () => mockPlants(),
  _setIsOnlineImpl: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import { enqueue } from '@/src/lib/mutationQueue'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { ICalendarEvent, TEventType } from '@/src/types/TCalendar'
import type {
    ICreateEventPayload,
    IUpdateEventPayload,
} from '@/src/types/TPayload'
import type { IPlant } from '@/src/types/TPlant'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { _setIsOnlineImpl, useCalendar } from '../useCalendar'

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

const EVENT_A: ICalendarEvent = {
  id: 'event-1',
  plantId: 'plant-1',
  gardenId: 'garden-1',
  eventType: 'planted',
  date: '2024-03-15',
  notes: 'Planted in raised bed',
  createdAt: '2024-03-15T00:00:00.000Z',
  updatedAt: '2024-03-15T00:00:00.000Z',
}

const EVENT_B: ICalendarEvent = {
  id: 'event-2',
  plantId: 'plant-2',
  eventType: 'watered',
  date: '2024-03-16',
  createdAt: '2024-03-16T00:00:00.000Z',
  updatedAt: '2024-03-16T00:00:00.000Z',
}

const EVENT_ORPHANED: ICalendarEvent = {
  id: 'event-3',
  plantId: 'plant-deleted',
  eventType: 'harvested',
  date: '2024-03-17',
  createdAt: '2024-03-17T00:00:00.000Z',
  updatedAt: '2024-03-17T00:00:00.000Z',
}

const CREATE_PAYLOAD: ICreateEventPayload = {
  plantId: 'plant-1',
  gardenId: 'garden-1',
  eventType: 'fertilized',
  date: '2024-04-01',
  notes: 'Applied compost',
}

const CREATED_EVENT: ICalendarEvent = {
  id: 'event-4',
  plantId: 'plant-1',
  gardenId: 'garden-1',
  eventType: 'fertilized',
  date: '2024-04-01',
  notes: 'Applied compost',
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z',
}

const UPDATE_PAYLOAD: IUpdateEventPayload = {
  notes: 'Updated notes',
  date: '2024-04-02',
}

const UPDATED_EVENT: ICalendarEvent = {
  ...EVENT_A,
  notes: 'Updated notes',
  date: '2024-04-02',
  updatedAt: '2024-04-02T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  _setIsOnlineImpl(async () => true)
  mockStorageGet.mockReturnValue(null)
  // Default: both plants exist
  mockPlants.mockReturnValue({
    plants: [PLANT_A, PLANT_B],
    isLoading: false,
    error: null,
    refreshPlants: jest.fn(),
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCalendar', () => {
  // -------------------------------------------------------------------------
  // 1. refreshEvents fetches and sets the events list (online)
  // -------------------------------------------------------------------------
  it('refreshEvents fetches events from the API and sets state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_B],
      status: 200,
    })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/calendar')
    expect(result.current.events).toEqual([EVENT_A, EVENT_B])
    expect(result.current.error).toBeNull()
    expect(mockStorageSet).toHaveBeenCalledWith('calendar_events_cache', [
      EVENT_A,
      EVENT_B,
    ])
  })

  // -------------------------------------------------------------------------
  // 2. createEvent adds to list (online) — Req 4.1
  // -------------------------------------------------------------------------
  it('createEvent appends the new event to state when online', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [EVENT_A], status: 200 })
    mockApiPost.mockResolvedValueOnce({ data: CREATED_EVENT, status: 201 })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: ICalendarEvent | undefined
    await act(async () => {
      created = await result.current.createEvent(CREATE_PAYLOAD)
    })

    expect(mockApiPost).toHaveBeenCalledWith('/calendar', CREATE_PAYLOAD)
    expect(created).toEqual(CREATED_EVENT)
    expect(result.current.events).toContainEqual(CREATED_EVENT)
  })

  // -------------------------------------------------------------------------
  // 3. updateEvent modifies existing event (online) — Req 4.3
  // -------------------------------------------------------------------------
  it('updateEvent updates the matching event in state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_B],
      status: 200,
    })
    mockApiPut.mockResolvedValueOnce({ data: UPDATED_EVENT, status: 200 })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: ICalendarEvent | undefined
    await act(async () => {
      updated = await result.current.updateEvent(EVENT_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).toHaveBeenCalledWith(
      `/calendar/${EVENT_A.id}`,
      UPDATE_PAYLOAD
    )
    expect(updated).toEqual(UPDATED_EVENT)
    const inState = result.current.events.find((e) => e.id === EVENT_A.id)
    expect(inState?.notes).toBe('Updated notes')
    expect(inState?.date).toBe('2024-04-02')
  })

  // -------------------------------------------------------------------------
  // 4. deleteEvent removes from list (online) — Req 4.4
  // -------------------------------------------------------------------------
  it('deleteEvent removes the event from state when online', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_B],
      status: 200,
    })
    mockApiDelete.mockResolvedValueOnce({ data: {}, status: 200 })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent(EVENT_A.id)
    })

    expect(mockApiDelete).toHaveBeenCalledWith(`/calendar/${EVENT_A.id}`)
    expect(result.current.events).not.toContainEqual(EVENT_A)
    expect(result.current.events).toContainEqual(EVENT_B)
  })

  // -------------------------------------------------------------------------
  // 5. Events are filtered by plantId when provided — Req 4.2
  // -------------------------------------------------------------------------
  it('filters events by plantId when provided', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_B],
      status: 200,
    })

    const { result } = renderHook(() => useCalendar('plant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toEqual([EVENT_A])
    expect(result.current.events.every((e) => e.plantId === 'plant-1')).toBe(
      true
    )
  })

  // -------------------------------------------------------------------------
  // 6. Orphaned events (plant deleted) are hidden from views — Req 4.6
  // -------------------------------------------------------------------------
  it('hides orphaned events where associated plant is deleted', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_B, EVENT_ORPHANED],
      status: 200,
    })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // EVENT_ORPHANED has plantId 'plant-deleted' which is not in the plants list
    expect(result.current.events).toContainEqual(EVENT_A)
    expect(result.current.events).toContainEqual(EVENT_B)
    expect(result.current.events).not.toContainEqual(EVENT_ORPHANED)
  })

  it('hides orphaned events even when filtering by plantId', async () => {
    // An event for a deleted plant should not appear even if we filter by that plantId
    mockApiGet.mockResolvedValueOnce({
      data: [EVENT_A, EVENT_ORPHANED],
      status: 200,
    })

    const { result } = renderHook(() => useCalendar('plant-deleted'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // 7. Offline mode serves from cache
  // -------------------------------------------------------------------------
  it('refreshEvents serves from MMKV cache when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([EVENT_A])

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).not.toHaveBeenCalled()
    expect(result.current.events).toEqual([EVENT_A])
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 8. Offline mode enqueues mutations (create)
  // -------------------------------------------------------------------------
  it('createEvent enqueues mutation and returns optimistic event when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([EVENT_A])

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: ICalendarEvent | undefined
    await act(async () => {
      created = await result.current.createEvent(CREATE_PAYLOAD)
    })

    expect(mockApiPost).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'create',
      resource: '/calendar',
      payload: CREATE_PAYLOAD,
    })
    expect(created).toBeDefined()
    expect(created?.plantId).toBe(CREATE_PAYLOAD.plantId)
    expect(created?.eventType).toBe(CREATE_PAYLOAD.eventType)
    expect(created?.date).toBe(CREATE_PAYLOAD.date)
    expect(created?.id).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 9. Offline mode enqueues mutations (update)
  // -------------------------------------------------------------------------
  it('updateEvent enqueues mutation and applies optimistic update when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([EVENT_A, EVENT_B])

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updated: ICalendarEvent | undefined
    await act(async () => {
      updated = await result.current.updateEvent(EVENT_A.id, UPDATE_PAYLOAD)
    })

    expect(mockApiPut).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'update',
      resource: `/calendar/${EVENT_A.id}`,
      payload: UPDATE_PAYLOAD,
    })
    expect(updated?.notes).toBe('Updated notes')
    expect(updated?.date).toBe('2024-04-02')
  })

  // -------------------------------------------------------------------------
  // 10. Offline mode enqueues mutations (delete)
  // -------------------------------------------------------------------------
  it('deleteEvent enqueues mutation and removes event optimistically when offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([EVENT_A, EVENT_B])

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent(EVENT_A.id)
    })

    expect(mockApiDelete).not.toHaveBeenCalled()
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: 'delete',
      resource: `/calendar/${EVENT_A.id}`,
      payload: null,
    })
    expect(result.current.events).not.toContainEqual(EVENT_A)
    expect(result.current.events).toContainEqual(EVENT_B)
  })

  // -------------------------------------------------------------------------
  // 11. Error state is set when API call fails — Req 9.3
  // -------------------------------------------------------------------------
  it('sets error state when refreshEvents API call fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Server error')
    expect(result.current.events).toBeDefined()
  })

  it('sets error state when createEvent API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockApiPost.mockRejectedValueOnce(new Error('Create failed'))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.createEvent(CREATE_PAYLOAD)).rejects.toThrow(
        'Create failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Create failed')
  })

  it('sets error state when deleteEvent API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [EVENT_A], status: 200 })
    mockApiDelete.mockRejectedValueOnce(new Error('Delete failed'))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.deleteEvent(EVENT_A.id)).rejects.toThrow(
        'Delete failed'
      )
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Delete failed')
  })

  // -------------------------------------------------------------------------
  // 12. All event types are supported — Req 4.5
  // -------------------------------------------------------------------------
  it('supports all event types: planted, fertilized, harvested, watered, pruned, custom', async () => {
    const eventTypes: TEventType[] = [
      'planted',
      'fertilized',
      'harvested',
      'watered',
      'pruned',
      'custom',
    ]

    const events: ICalendarEvent[] = eventTypes.map((eventType, i) => ({
      id: `event-type-${i}`,
      plantId: 'plant-1',
      eventType,
      date: `2024-04-0${i + 1}`,
      createdAt: `2024-04-0${i + 1}T00:00:00.000Z`,
      updatedAt: `2024-04-0${i + 1}T00:00:00.000Z`,
    }))

    mockApiGet.mockResolvedValueOnce({ data: events, status: 200 })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toHaveLength(eventTypes.length)
    eventTypes.forEach((type) => {
      expect(result.current.events.some((e) => e.eventType === type)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // updateEvent throws when event not found (offline)
  // -------------------------------------------------------------------------
  it('updateEvent throws when event is not found offline', async () => {
    _setIsOnlineImpl(async () => false)
    mockStorageGet.mockReturnValue([EVENT_A])

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(
        result.current.updateEvent('non-existent', UPDATE_PAYLOAD)
      ).rejects.toThrow('Calendar event with id "non-existent" not found')
    })
  })
})
