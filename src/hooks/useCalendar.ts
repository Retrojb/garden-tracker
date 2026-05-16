/**
 * useCalendar hook
 *
 * Manages calendar event CRUD operations with Zustand-backed local state.
 * When the device is online, operations are forwarded to the API and the
 * local state is updated on success. When offline, the current events list
 * is served from the MMKV cache and mutations are enqueued via
 * `mutationQueue` for later sync.
 *
 * Accepts an optional `plantId` filter to return only events for a specific
 * plant. Hides orphaned events (where the associated plant has been deleted)
 * from normal views by cross-referencing the current plants list.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useCallback, useEffect, useMemo } from 'react'
import { create } from 'zustand'

import { API_ROUTES } from '@/src/constants/api'
import { apiClient } from '@/src/lib/apiClient'
import { enqueue } from '@/src/lib/mutationQueue'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { ICalendarEvent } from '@/src/types/TCalendar'
import type {
    ICreateEventPayload,
    IUpdateEventPayload,
} from '@/src/types/TPayload'
import type { UseCalendarResult } from '@/src/types/TUseCalendar'

import { usePlants } from './usePlants'

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

const CALENDAR_CACHE_KEY = 'calendar_events_cache'

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface CalendarState {
  events: ICalendarEvent[]
  isLoading: boolean
  error: Error | null
  _setEvents: (events: ICalendarEvent[]) => void
  _setLoading: (isLoading: boolean) => void
  _setError: (error: Error | null) => void
}

const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoading: false,
  error: null,
  _setEvents: (events) => set({ events }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setError: (error) => set({ error }),
}))

// ---------------------------------------------------------------------------
// Network helper
// ---------------------------------------------------------------------------

const checkIsOnline = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3_000),
    })
    return response.ok
  } catch {
    return false
  }
}

let _isOnlineImpl: () => Promise<boolean> = checkIsOnline

/** @internal — exposed for testing only */
const _setIsOnlineImpl = (impl: () => Promise<boolean>): void => {
  _isOnlineImpl = impl
}

const isOnline = (): Promise<boolean> => _isOnlineImpl()

// ---------------------------------------------------------------------------
// UUID helper
// ---------------------------------------------------------------------------

const generateId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const useCalendar = (plantId?: string): UseCalendarResult => {
  const { events, isLoading, error, _setEvents, _setLoading, _setError } =
    useCalendarStore()

  // Req 4.6: get current plants list to detect orphaned events
  const { plants } = usePlants()

  // -------------------------------------------------------------------------
  // Derived: filter by plantId and hide orphaned events
  // -------------------------------------------------------------------------

  const filteredEvents = useMemo(() => {
    // Build a set of valid plant IDs for O(1) lookup
    const validPlantIds = new Set(plants.map((p) => p.id))

    // Req 4.6: hide orphaned events (plant no longer exists)
    let visible = events.filter((event) => validPlantIds.has(event.plantId))

    // Req 4.2: filter by plantId when provided
    if (plantId) {
      visible = visible.filter((event) => event.plantId === plantId)
    }

    return visible
  }, [events, plants, plantId])

  // -------------------------------------------------------------------------
  // refreshEvents
  // -------------------------------------------------------------------------

  const refreshEvents = useCallback(async (): Promise<void> => {
    _setLoading(true)
    _setError(null)

    try {
      const online = await isOnline()

      if (!online) {
        // Req 8.1: serve from cache when offline
        const cached = storageGet<ICalendarEvent[]>(CALENDAR_CACHE_KEY)
        _setEvents(cached ?? [])
        _setLoading(false)
        return
      }

      const response = await apiClient.get<ICalendarEvent[]>(
        API_ROUTES.CALENDAR
      )
      _setEvents(response.data)
      // Persist to cache for offline use
      storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, response.data)
    } catch (err) {
      // Req 9.3: set error state, do not crash
      _setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      _setLoading(false)
    }
  }, [_setEvents, _setLoading, _setError])

  // -------------------------------------------------------------------------
  // createEvent
  // -------------------------------------------------------------------------

  const createEvent = useCallback(
    async (payload: ICreateEventPayload): Promise<ICalendarEvent> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic local record + enqueue mutation
        const optimistic: ICalendarEvent = {
          id: generateId(),
          plantId: payload.plantId,
          gardenId: payload.gardenId,
          eventType: payload.eventType,
          date: payload.date,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const updated = [...events, optimistic]
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)

        await enqueue({
          type: 'create',
          resource: API_ROUTES.CALENDAR,
          payload,
        })

        return optimistic
      }

      try {
        const response = await apiClient.post<ICalendarEvent>(
          API_ROUTES.CALENDAR,
          payload
        )
        const created = response.data

        // Req 4.1: append to list and persist
        const updated = [...events, created]
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)

        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [events, _setEvents, _setError]
  )

  // -------------------------------------------------------------------------
  // updateEvent
  // -------------------------------------------------------------------------

  const updateEvent = useCallback(
    async (
      id: string,
      payload: IUpdateEventPayload
    ): Promise<ICalendarEvent> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic update + enqueue mutation
        const existing = events.find((e) => e.id === id)
        if (!existing) {
          throw new Error(`Calendar event with id "${id}" not found`)
        }

        const optimistic: ICalendarEvent = {
          ...existing,
          ...payload,
          updatedAt: new Date().toISOString(),
        }

        const updated = events.map((e) => (e.id === id ? optimistic : e))
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)

        await enqueue({
          type: 'update',
          resource: `${API_ROUTES.CALENDAR}/${id}`,
          payload,
        })

        return optimistic
      }

      try {
        const response = await apiClient.put<ICalendarEvent>(
          `${API_ROUTES.CALENDAR}/${id}`,
          payload
        )
        const updatedEvent = response.data

        // Req 4.3: replace in-place by id
        const updated = events.map((e) => (e.id === id ? updatedEvent : e))
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)

        return updatedEvent
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [events, _setEvents, _setError]
  )

  // -------------------------------------------------------------------------
  // deleteEvent
  // -------------------------------------------------------------------------

  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic removal + enqueue mutation
        const updated = events.filter((e) => e.id !== id)
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)

        await enqueue({
          type: 'delete',
          resource: `${API_ROUTES.CALENDAR}/${id}`,
          payload: null,
        })

        return
      }

      try {
        await apiClient.delete(`${API_ROUTES.CALENDAR}/${id}`)

        // Req 4.4: remove from list
        const updated = events.filter((e) => e.id !== id)
        _setEvents(updated)
        storageSet<ICalendarEvent[]>(CALENDAR_CACHE_KEY, updated)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [events, _setEvents, _setError]
  )

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    void refreshEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    events: filteredEvents,
    isLoading,
    error,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}

export { _setIsOnlineImpl, useCalendar }
