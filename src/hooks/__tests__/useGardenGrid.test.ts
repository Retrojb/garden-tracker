/**
 * Unit tests for the useGardenGrid hook.
 *
 * Covers:
 *  1. Initial state with no options
 *  2. Initial state with provided initialCells
 *  3. handleCellChange with 'draw' tool marks cell as filled (Req 3.2)
 *  4. handleCellChange with 'erase' tool removes cell from map (Req 3.3)
 *  5. handleCellChange with 'place_plant' tool places valid plant (Req 3.4)
 *  6. handleCellChange with 'place_plant' rejects null plantId (Req 3.6)
 *  7. handleCellChange with 'place_plant' rejects invalid plantId (Req 3.6)
 *  8. handleCellChange with 'select' tool does not modify cells
 *  9. clearGrid resets cells to empty map (Req 3.8)
 * 10. exportGridSnapshot returns a string (Req 3.9)
 * 11. setActiveTool changes the active tool
 * 12. Other cells remain unchanged after a single tool application
 */

import type { ICellState } from '@/src/types/TGardenGrid'
import type { IPlant } from '@/src/types/TPlant'
import { act, renderHook } from '@testing-library/react-native'

import { buildCellKey, useGardenGrid } from '../useGardenGrid'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLANT_A: IPlant = {
  id: 'plant-1',
  name: 'Tomato',
  species: 'Solanum lycopersicum',
  variety: 'Cherry',
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

const MOCK_PLANTS: IPlant[] = [PLANT_A, PLANT_B]

const getPlants = (): IPlant[] => MOCK_PLANTS

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGardenGrid', () => {
  // -------------------------------------------------------------------------
  // 1. Initial state with no options
  // -------------------------------------------------------------------------
  it('initializes with empty cells and draw tool when no options provided', () => {
    const { result } = renderHook(() => useGardenGrid())

    expect(result.current.cells).toEqual({})
    expect(result.current.activeTool).toBe('draw')
  })

  // -------------------------------------------------------------------------
  // 2. Initial state with provided initialCells
  // -------------------------------------------------------------------------
  it('initializes with provided initialCells', () => {
    const initialCells: Record<string, ICellState> = {
      '0:0': { filled: true },
      '1:2': { filled: true, plantId: 'plant-1' },
    }

    const { result } = renderHook(() =>
      useGardenGrid({ initialCells, getPlants })
    )

    expect(result.current.cells).toEqual(initialCells)
  })

  // -------------------------------------------------------------------------
  // 3. handleCellChange with 'draw' tool marks cell as filled (Req 3.2)
  // -------------------------------------------------------------------------
  it('draw tool marks the touched cell as filled', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    act(() => {
      result.current.handleCellChange(2, 3, { filled: true })
    })

    expect(result.current.cells['2:3']).toEqual({ filled: true })
  })

  // -------------------------------------------------------------------------
  // 4. handleCellChange with 'erase' tool removes cell from map (Req 3.3)
  // -------------------------------------------------------------------------
  it('erase tool removes the cell from the map', () => {
    const initialCells: Record<string, ICellState> = {
      '2:3': { filled: true },
      '4:5': { filled: true },
    }

    const { result } = renderHook(() =>
      useGardenGrid({ initialCells, getPlants })
    )

    act(() => {
      result.current.setActiveTool('erase')
    })

    act(() => {
      result.current.handleCellChange(2, 3, { filled: false })
    })

    expect(result.current.cells['2:3']).toBeUndefined()
    // Other cells remain
    expect(result.current.cells['4:5']).toEqual({ filled: true })
  })

  // -------------------------------------------------------------------------
  // 5. handleCellChange with 'place_plant' tool places valid plant (Req 3.4)
  // -------------------------------------------------------------------------
  it('place_plant tool places a valid plant in the cell', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    act(() => {
      result.current.setActiveTool('place_plant')
    })

    act(() => {
      result.current.handleCellChange(1, 1, {
        filled: true,
        plantId: 'plant-1',
      })
    })

    expect(result.current.cells['1:1']).toEqual({
      filled: true,
      plantId: 'plant-1',
    })
  })

  // -------------------------------------------------------------------------
  // 6. handleCellChange with 'place_plant' rejects null plantId (Req 3.6)
  // -------------------------------------------------------------------------
  it('place_plant tool rejects placement when plantId is not provided', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    act(() => {
      result.current.setActiveTool('place_plant')
    })

    act(() => {
      result.current.handleCellChange(1, 1, { filled: true })
    })

    expect(result.current.cells['1:1']).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // 7. handleCellChange with 'place_plant' rejects invalid plantId (Req 3.6)
  // -------------------------------------------------------------------------
  it('place_plant tool rejects placement when plantId does not reference a valid plant', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    act(() => {
      result.current.setActiveTool('place_plant')
    })

    act(() => {
      result.current.handleCellChange(1, 1, {
        filled: true,
        plantId: 'non-existent-plant',
      })
    })

    expect(result.current.cells['1:1']).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // 8. handleCellChange with 'select' tool does not modify cells
  // -------------------------------------------------------------------------
  it('select tool does not modify cells', () => {
    const initialCells: Record<string, ICellState> = {
      '0:0': { filled: true },
    }

    const { result } = renderHook(() =>
      useGardenGrid({ initialCells, getPlants })
    )

    act(() => {
      result.current.setActiveTool('select')
    })

    act(() => {
      result.current.handleCellChange(0, 0, { filled: true })
    })

    expect(result.current.cells).toEqual(initialCells)
  })

  // -------------------------------------------------------------------------
  // 9. clearGrid resets cells to empty map (Req 3.8)
  // -------------------------------------------------------------------------
  it('clearGrid resets all cells to an empty state', () => {
    const initialCells: Record<string, ICellState> = {
      '0:0': { filled: true },
      '1:1': { filled: true, plantId: 'plant-1' },
      '2:2': { filled: true },
    }

    const { result } = renderHook(() =>
      useGardenGrid({ initialCells, getPlants })
    )

    act(() => {
      result.current.clearGrid()
    })

    expect(result.current.cells).toEqual({})
  })

  // -------------------------------------------------------------------------
  // 10. exportGridSnapshot returns a string (Req 3.9)
  // -------------------------------------------------------------------------
  it('exportGridSnapshot returns a string', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    const snapshot = result.current.exportGridSnapshot()

    expect(typeof snapshot).toBe('string')
  })

  // -------------------------------------------------------------------------
  // 11. setActiveTool changes the active tool
  // -------------------------------------------------------------------------
  it('setActiveTool changes the active tool', () => {
    const { result } = renderHook(() => useGardenGrid({ getPlants }))

    expect(result.current.activeTool).toBe('draw')

    act(() => {
      result.current.setActiveTool('erase')
    })

    expect(result.current.activeTool).toBe('erase')

    act(() => {
      result.current.setActiveTool('place_plant')
    })

    expect(result.current.activeTool).toBe('place_plant')
  })

  // -------------------------------------------------------------------------
  // 12. Other cells remain unchanged after a single tool application
  // -------------------------------------------------------------------------
  it('other cells remain unchanged after a single draw operation', () => {
    const initialCells: Record<string, ICellState> = {
      '0:0': { filled: true },
      '3:3': { filled: true, plantId: 'plant-1' },
    }

    const { result } = renderHook(() =>
      useGardenGrid({ initialCells, getPlants })
    )

    act(() => {
      result.current.handleCellChange(1, 1, { filled: true })
    })

    // Original cells unchanged
    expect(result.current.cells['0:0']).toEqual({ filled: true })
    expect(result.current.cells['3:3']).toEqual({
      filled: true,
      plantId: 'plant-1',
    })
    // New cell added
    expect(result.current.cells['1:1']).toEqual({ filled: true })
  })

  // -------------------------------------------------------------------------
  // 13. place_plant without getPlants rejects all placements
  // -------------------------------------------------------------------------
  it('place_plant rejects placement when no getPlants function is provided', () => {
    const { result } = renderHook(() => useGardenGrid())

    act(() => {
      result.current.setActiveTool('place_plant')
    })

    act(() => {
      result.current.handleCellChange(1, 1, {
        filled: true,
        plantId: 'plant-1',
      })
    })

    // Without getPlants, plants array is empty, so validation fails
    expect(result.current.cells['1:1']).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// buildCellKey utility
// ---------------------------------------------------------------------------

describe('buildCellKey', () => {
  it('formats key as "row:col"', () => {
    expect(buildCellKey(0, 0)).toBe('0:0')
    expect(buildCellKey(5, 10)).toBe('5:10')
    expect(buildCellKey(99, 199)).toBe('99:199')
  })
})
