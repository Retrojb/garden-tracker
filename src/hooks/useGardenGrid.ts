/**
 * useGardenGrid hook
 *
 * Encapsulates garden grid state and drawing logic. Manages the sparse cell
 * map, active drawing tool, and provides handlers for cell changes, grid
 * clearing, and snapshot export.
 *
 * The Touch Drawing Algorithm:
 * - draw: cells[key] = { filled: true }
 * - erase: DELETE cells[key]
 * - place_plant: ASSERT plantId IS NOT NULL and valid; cells[key] = { filled: true, plantId }
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9
 */

import { useCallback, useRef, useState } from 'react'

import type { ICellState, TDrawingTool } from '@/src/types/TGardenGrid'
import type { IPlant } from '@/src/types/TPlant'
import type { UseGardenGridResult } from '@/src/types/TUseGardenGrid'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseGardenGridOptions {
  /** Pre-existing cell state (e.g. loaded from DB) */
  readonly initialCells?: Record<string, ICellState>
  /** Function to retrieve the current plants collection for validation */
  readonly getPlants?: () => IPlant[]
}

// ---------------------------------------------------------------------------
// Key format helper
// ---------------------------------------------------------------------------

/**
 * Generates the cell key in the format "row:col".
 */
const buildCellKey = (row: number, col: number): string => `${row}:${col}`

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const useGardenGrid = (options?: UseGardenGridOptions): UseGardenGridResult => {
  const { initialCells = {}, getPlants } = options ?? {}

  const [cells, setCells] = useState<Record<string, ICellState>>(initialCells)
  const [activeTool, setActiveTool] = useState<TDrawingTool>('draw')

  // Use a ref for getPlants to avoid stale closures without adding it to deps
  const getPlantsRef = useRef(getPlants)
  getPlantsRef.current = getPlants

  // ---------------------------------------------------------------------------
  // handleCellChange — Touch Drawing Algorithm
  // ---------------------------------------------------------------------------

  const handleCellChange = useCallback(
    (row: number, col: number, state: ICellState): void => {
      const key = buildCellKey(row, col)

      setCells((prevCells) => {
        switch (activeTool) {
          case 'draw': {
            // Req 3.2: mark the touched cell as filled
            return { ...prevCells, [key]: { filled: true } }
          }

          case 'erase': {
            // Req 3.3: remove the fill from the touched cell
            const { [key]: _removed, ...rest } = prevCells
            return rest
          }

          case 'place_plant': {
            // Req 3.4 + 3.6: place plant with validation
            const plantId = state.plantId

            // ASSERT selectedPlantId IS NOT NULL
            if (!plantId) {
              return prevCells
            }

            // Validate plantId references a valid Plant in the collection
            const plants = getPlantsRef.current?.() ?? []
            const isValidPlant = plants.some((p) => p.id === plantId)

            if (!isValidPlant) {
              // Req 3.6: reject placement with invalid plantId
              return prevCells
            }

            return {
              ...prevCells,
              [key]: { filled: true, plantId },
            }
          }

          case 'select': {
            // Select tool does not modify cells
            return prevCells
          }

          default: {
            return prevCells
          }
        }
      })
    },
    [activeTool]
  )

  // ---------------------------------------------------------------------------
  // clearGrid — Req 3.8
  // ---------------------------------------------------------------------------

  const clearGrid = useCallback((): void => {
    setCells({})
  }, [])

  // ---------------------------------------------------------------------------
  // exportGridSnapshot — Req 3.9
  // ---------------------------------------------------------------------------

  /**
   * Exports the current grid state as a base64-encoded PNG string.
   *
   * TODO: Implement full Skia-based rendering when @shopify/react-native-skia
   * Canvas offscreen rendering is wired up. For now, returns an empty string
   * as a stub since offscreen Skia rendering requires a native context that
   * is not available in all environments (e.g., tests, web).
   */
  const exportGridSnapshot = useCallback((): string => {
    // TODO: Implement with @shopify/react-native-skia offscreen canvas
    // The implementation would:
    // 1. Create an offscreen Skia surface with dimensions based on grid size
    // 2. Draw each filled cell as a rectangle on the canvas
    // 3. Encode the surface to a base64 PNG string
    // 4. Return the encoded string
    return ''
  }, [])

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    cells,
    activeTool,
    setActiveTool,
    handleCellChange,
    clearGrid,
    exportGridSnapshot,
  }
}

export { buildCellKey, useGardenGrid }
