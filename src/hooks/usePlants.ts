/**
 * usePlants hook
 *
 * Fetches and caches plant data filtered by garden ID using Zustand + MMKV,
 * following the same pattern as useGardens.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2
 */

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'

import { API_ROUTES } from '@/src/constants/api'
import { apiClient } from '@/src/lib/apiClient'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { IPlant } from '@/src/types/TPlant'
import type { UsePlantsResult } from '@/src/types/TUsePlants'

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

const PLANTS_CACHE_KEY = (gardenId: string) => `plants_cache_${gardenId}`

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface PlantsState {
  plants: IPlant[]
  isLoading: boolean
  error: Error | null
  _setPlants: (plants: IPlant[]) => void
  _setLoading: (isLoading: boolean) => void
  _setError: (error: Error | null) => void
}

const usePlantsStore = create<PlantsState>((set) => ({
  plants: [],
  isLoading: false,
  error: null,
  _setPlants: (plants) => set({ plants }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setError: (error) => set({ error }),
}))

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const usePlants = (gardenId: string): UsePlantsResult => {
  const { plants, isLoading, error, _setPlants, _setLoading, _setError } =
    usePlantsStore()

  // -------------------------------------------------------------------------
  // refreshPlants
  // -------------------------------------------------------------------------

  const refreshPlants = useCallback(async (): Promise<void> => {
    _setLoading(true)
    _setError(null)

    try {
      const response = await apiClient.get<IPlant[]>(
        `${API_ROUTES.PLANTS}?gardenId=${gardenId}`
      )
      const filtered = response.data.filter((p) => p.gardenId === gardenId)
      _setPlants(filtered)
      storageSet<IPlant[]>(PLANTS_CACHE_KEY(gardenId), filtered)
    } catch {
      // Req 3.3 / 3.6: serve from cache on failure (offline support)
      const cached = storageGet<IPlant[]>(PLANTS_CACHE_KEY(gardenId))
      if (cached) {
        _setPlants(cached)
      } else {
        // Req 3.5: expose error state
        _setError(new Error('Failed to fetch plants'))
      }
    } finally {
      _setLoading(false)
    }
  }, [gardenId, _setPlants, _setLoading, _setError])

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (gardenId) {
      void refreshPlants()
    }
  }, [gardenId, refreshPlants])

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return { plants, isLoading, error, refreshPlants }
}

export { usePlants }
