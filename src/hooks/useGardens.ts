/**
 * useGardens hook
 *
 * Manages garden CRUD operations with Zustand-backed local state.
 * When the device is online, operations are forwarded to the API and the
 * local state is updated on success.  When offline, the current gardens list
 * is served from the MMKV cache and mutations are enqueued via
 * `mutationQueue` for later sync.
 *
 * Requirements: 2.1, 2.7, 2.8, 2.9, 8.1, 8.2
 */

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'

import { API_ROUTES } from '@/src/constants/api'
import { apiClient } from '@/src/lib/apiClient'
import { enqueue } from '@/src/lib/mutationQueue'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { IGarden } from '@/src/types/TGarden'
import type {
  ICreateGardenPayload,
  IUpdateGardenPayload,
} from '@/src/types/TPayload'

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

const GARDENS_CACHE_KEY = 'gardens_cache'

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface GardensState {
  gardens: IGarden[]
  isLoading: boolean
  error: Error | null
  _setGardens: (gardens: IGarden[]) => void
  _setLoading: (isLoading: boolean) => void
  _setError: (error: Error | null) => void
}

const useGardensStore = create<GardensState>((set) => ({
  gardens: [],
  isLoading: false,
  error: null,
  _setGardens: (gardens) => set({ gardens }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setError: (error) => set({ error }),
}))

// ---------------------------------------------------------------------------
// Network helper
// ---------------------------------------------------------------------------

/**
 * Checks connectivity by attempting a lightweight HEAD request to a reliable
 * endpoint.  Falls back to `true` (assume online) if the check itself throws
 * an unexpected error, so the hook degrades gracefully.
 *
 * Exported so tests can override it via `jest.mock`.
 */
const checkIsOnline = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      // Short timeout via AbortController
      signal: AbortSignal.timeout(3_000),
    })
    return response.ok
  } catch {
    return false
  }
}

// Allow tests (and future callers) to swap the connectivity check
let _isOnlineImpl: () => Promise<boolean> = checkIsOnline

/** @internal — exposed for testing only */
const _setIsOnlineImpl = (impl: () => Promise<boolean>): void => {
  _isOnlineImpl = impl
}

const isOnline = (): Promise<boolean> => _isOnlineImpl()

// ---------------------------------------------------------------------------
// UUID helper (mirrors mutationQueue implementation)
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

export interface UseGardensResult {
  gardens: IGarden[]
  isLoading: boolean
  error: Error | null
  createGarden: (payload: ICreateGardenPayload) => Promise<IGarden>
  updateGarden: (id: string, payload: IUpdateGardenPayload) => Promise<IGarden>
  deleteGarden: (id: string) => Promise<void>
  refreshGardens: () => Promise<void>
}

const useGardens = (): UseGardensResult => {
  const { gardens, isLoading, error, _setGardens, _setLoading, _setError } =
    useGardensStore()

  // -------------------------------------------------------------------------
  // refreshGardens
  // -------------------------------------------------------------------------

  const refreshGardens = useCallback(async (): Promise<void> => {
    _setLoading(true)
    _setError(null)

    try {
      const online = await isOnline()

      if (!online) {
        // Req 8.1: serve from cache when offline
        const cached = storageGet<IGarden[]>(GARDENS_CACHE_KEY)
        _setGardens(cached ?? [])
        _setLoading(false)
        return
      }

      const response = await apiClient.get<IGarden[]>(API_ROUTES.GARDENS)
      _setGardens(response.data)
      // Persist to cache for offline use
      storageSet<IGarden[]>(GARDENS_CACHE_KEY, response.data)
    } catch (err) {
      // Req 9.3: set error state, do not crash
      _setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      _setLoading(false)
    }
  }, [_setGardens, _setLoading, _setError])

  // -------------------------------------------------------------------------
  // createGarden
  // -------------------------------------------------------------------------

  const createGarden = useCallback(
    async (payload: ICreateGardenPayload): Promise<IGarden> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic local record + enqueue mutation
        const optimistic: IGarden = {
          id: generateId(),
          name: payload.name,
          type: payload.type,
          size: `${payload.dimensions.widthInches / 12}x${payload.dimensions.heightInches / 12} ft`,
          dimensions: payload.dimensions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const updated = [...gardens, optimistic]
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)

        await enqueue({
          type: 'create',
          resource: API_ROUTES.GARDENS,
          payload,
        })

        return optimistic
      }

      try {
        const response = await apiClient.post<IGarden>(
          API_ROUTES.GARDENS,
          payload
        )
        const created = response.data

        // Req 2.1: append to list
        const updated = [...gardens, created]
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)

        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [gardens, _setGardens, _setError]
  )

  // -------------------------------------------------------------------------
  // updateGarden
  // -------------------------------------------------------------------------

  const updateGarden = useCallback(
    async (id: string, payload: IUpdateGardenPayload): Promise<IGarden> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic update + enqueue mutation
        const existing = gardens.find((g) => g.id === id)
        if (!existing) {
          throw new Error(`Garden with id "${id}" not found`)
        }

        const optimistic: IGarden = {
          ...existing,
          ...payload,
          updatedAt: new Date().toISOString(),
        }

        const updated = gardens.map((g) => (g.id === id ? optimistic : g))
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)

        await enqueue({
          type: 'update',
          resource: `${API_ROUTES.GARDENS}/${id}`,
          payload,
        })

        return optimistic
      }

      try {
        const response = await apiClient.put<IGarden>(
          `${API_ROUTES.GARDENS}/${id}`,
          payload
        )
        const updated_garden = response.data

        // Req 2.9: idempotent — replace in-place by id
        const updated = gardens.map((g) => (g.id === id ? updated_garden : g))
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)

        return updated_garden
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [gardens, _setGardens, _setError]
  )

  // -------------------------------------------------------------------------
  // deleteGarden
  // -------------------------------------------------------------------------

  const deleteGarden = useCallback(
    async (id: string): Promise<void> => {
      _setError(null)

      const online = await isOnline()

      if (!online) {
        // Req 8.1 / 8.2: optimistic removal + enqueue mutation
        const updated = gardens.filter((g) => g.id !== id)
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)

        await enqueue({
          type: 'delete',
          resource: `${API_ROUTES.GARDENS}/${id}`,
          payload: null,
        })

        return
      }

      try {
        await apiClient.delete(`${API_ROUTES.GARDENS}/${id}`)

        // Req 2.8: remove from list
        const updated = gardens.filter((g) => g.id !== id)
        _setGardens(updated)
        storageSet<IGarden[]>(GARDENS_CACHE_KEY, updated)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        _setError(error)
        throw error
      }
    },
    [gardens, _setGardens, _setError]
  )

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    void refreshGardens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    gardens,
    isLoading,
    error,
    createGarden,
    updateGarden,
    deleteGarden,
    refreshGardens,
  }
}

export { _setIsOnlineImpl, useGardens }
