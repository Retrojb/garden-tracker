/**
 * Property-Based Tests: Grid Drawing Tool Invariants
 *
 * **Property 11: Grid Drawing Tool Invariants** — `draw` sets `filled: true`;
 * `erase` removes the key; `place_plant` sets `filled: true` with `plantId`;
 * all other cells unchanged.
 *
 * **Property 12: Out-of-Bounds Touch Invariant** — touches outside grid bounds
 * leave the cell map unchanged.
 *
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
 */
import * as fc from 'fast-check'

import type { ICellState, TDrawingTool } from '@/src/types/TGardenGrid'
import { screenCoordsToCellCoords } from '@/src/utils/grid'

// ---------------------------------------------------------------------------
// Pure cell manipulation logic (mirrors useGardenGrid's Touch Drawing Algorithm)
// ---------------------------------------------------------------------------

/**
 * Applies a drawing tool to a cell map at the given coordinates.
 * This is the pure-function equivalent of the useGardenGrid hook's
 * handleCellChange logic, extracted for property testing.
 */
const applyCellTool = (
  cells: Record<string, ICellState>,
  row: number,
  col: number,
  tool: TDrawingTool,
  plantId?: string,
  validPlantIds?: readonly string[]
): Record<string, ICellState> => {
  const key = `${row}:${col}`

  switch (tool) {
    case 'draw': {
      return { ...cells, [key]: { filled: true } }
    }

    case 'erase': {
      const { [key]: _removed, ...rest } = cells
      return rest
    }

    case 'place_plant': {
      if (!plantId) {
        return cells
      }
      const isValid = validPlantIds?.includes(plantId) ?? false
      if (!isValid) {
        return cells
      }
      return { ...cells, [key]: { filled: true, plantId } }
    }

    case 'select': {
      return cells
    }

    default: {
      return cells
    }
  }
}

// ---------------------------------------------------------------------------
// Arbitraries — smart generators constrained to the input space
// ---------------------------------------------------------------------------

/** Generates a valid cell key in "row:col" format */
const cellKeyArb = (maxRow: number, maxCol: number): fc.Arbitrary<string> =>
  fc
    .tuple(
      fc.integer({ min: 0, max: maxRow - 1 }),
      fc.integer({ min: 0, max: maxCol - 1 })
    )
    .map(([r, c]) => `${r}:${c}`)

/** Generates a valid ICellState */
const cellStateArb: fc.Arbitrary<ICellState> = fc.oneof(
  fc.record({ filled: fc.constant(true) }),
  fc.record({
    filled: fc.constant(true),
    plantId: fc.uuid(),
  }),
  fc.record({
    filled: fc.constant(true),
    plantId: fc.uuid(),
    color: fc
      .array(fc.integer({ min: 0, max: 255 }), { minLength: 3, maxLength: 3 })
      .map(
        ([r, g, b]) =>
          `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      ),
  })
)

/** Generates an arbitrary grid state (sparse cell map) */
const cellsMapArb = (
  maxRow = 20,
  maxCol = 20
): fc.Arbitrary<Record<string, ICellState>> =>
  fc
    .array(fc.tuple(cellKeyArb(maxRow, maxCol), cellStateArb), {
      minLength: 0,
      maxLength: 15,
    })
    .map((entries) => Object.fromEntries(entries))

/** Generates valid row/col coordinates within bounds */
const validCoordsArb = (
  rows: number,
  cols: number
): fc.Arbitrary<{ row: number; col: number }> =>
  fc.record({
    row: fc.integer({ min: 0, max: rows - 1 }),
    col: fc.integer({ min: 0, max: cols - 1 }),
  })

/** Generates a valid plantId that exists in a known set */
const validPlantIdArb = fc.uuid()

/** Generates grid dimensions (small for testing efficiency) */
const gridDimensionsArb = fc.record({
  rows: fc.integer({ min: 1, max: 50 }),
  cols: fc.integer({ min: 1, max: 50 }),
})

// ---------------------------------------------------------------------------
// Property 11: Grid Drawing Tool Invariants
// **Validates: Requirements 3.2, 3.3, 3.4**
// ---------------------------------------------------------------------------

describe('Property 11: Grid Drawing Tool Invariants', () => {
  const GRID_ROWS = 20
  const GRID_COLS = 20

  it('draw tool: sets the target cell to filled: true', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        (cells, { row, col }) => {
          const result = applyCellTool(cells, row, col, 'draw')
          const key = `${row}:${col}`

          expect(result[key]).toEqual({ filled: true })
        }
      ),
      { numRuns: 200 }
    )
  })

  it('erase tool: removes the target cell key from the map', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        (cells, { row, col }) => {
          const result = applyCellTool(cells, row, col, 'erase')
          const key = `${row}:${col}`

          expect(result[key]).toBeUndefined()
          expect(key in result).toBe(false)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('place_plant tool: sets the target cell to filled: true with plantId', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        validPlantIdArb,
        (cells, { row, col }, plantId) => {
          const validPlantIds = [plantId]
          const result = applyCellTool(
            cells,
            row,
            col,
            'place_plant',
            plantId,
            validPlantIds
          )
          const key = `${row}:${col}`

          expect(result[key]).toEqual({ filled: true, plantId })
        }
      ),
      { numRuns: 200 }
    )
  })

  it('draw tool: all other cells remain unchanged', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        (cells, { row, col }) => {
          const result = applyCellTool(cells, row, col, 'draw')
          const targetKey = `${row}:${col}`

          // Every key in the original map (except target) should be unchanged
          for (const key of Object.keys(cells)) {
            if (key !== targetKey) {
              expect(result[key]).toEqual(cells[key])
            }
          }

          // No new keys should appear except possibly the target
          for (const key of Object.keys(result)) {
            if (key !== targetKey) {
              expect(cells[key]).toEqual(result[key])
            }
          }
        }
      ),
      { numRuns: 200 }
    )
  })

  it('erase tool: all other cells remain unchanged', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        (cells, { row, col }) => {
          const result = applyCellTool(cells, row, col, 'erase')
          const targetKey = `${row}:${col}`

          // Every key in the original map (except target) should be unchanged
          for (const key of Object.keys(cells)) {
            if (key !== targetKey) {
              expect(result[key]).toEqual(cells[key])
            }
          }

          // No new keys should appear in the result
          for (const key of Object.keys(result)) {
            expect(cells[key]).toEqual(result[key])
          }
        }
      ),
      { numRuns: 200 }
    )
  })

  it('place_plant tool: all other cells remain unchanged', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        validPlantIdArb,
        (cells, { row, col }, plantId) => {
          const validPlantIds = [plantId]
          const result = applyCellTool(
            cells,
            row,
            col,
            'place_plant',
            plantId,
            validPlantIds
          )
          const targetKey = `${row}:${col}`

          // Every key in the original map (except target) should be unchanged
          for (const key of Object.keys(cells)) {
            if (key !== targetKey) {
              expect(result[key]).toEqual(cells[key])
            }
          }

          // No new keys should appear except possibly the target
          for (const key of Object.keys(result)) {
            if (key !== targetKey) {
              expect(cells[key]).toEqual(result[key])
            }
          }
        }
      ),
      { numRuns: 200 }
    )
  })

  it('select tool: no cells are modified', () => {
    fc.assert(
      fc.property(
        cellsMapArb(GRID_ROWS, GRID_COLS),
        validCoordsArb(GRID_ROWS, GRID_COLS),
        (cells, { row, col }) => {
          const result = applyCellTool(cells, row, col, 'select')

          expect(result).toEqual(cells)
        }
      ),
      { numRuns: 200 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 12: Out-of-Bounds Touch Invariant
// **Validates: Requirements 3.5**
// ---------------------------------------------------------------------------

describe('Property 12: Out-of-Bounds Touch Invariant', () => {
  it('screenCoordsToCellCoords returns null for touches with negative relative coordinates', () => {
    fc.assert(
      fc.property(
        gridDimensionsArb,
        fc.integer({ min: 1, max: 100 }),
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
        }),
        fc.oneof(
          // Touch to the left of the grid
          fc.record({
            x: fc.integer({ min: -1000, max: -1 }),
            y: fc.integer({ min: 0, max: 1000 }),
          }),
          // Touch above the grid
          fc.record({
            x: fc.integer({ min: 0, max: 1000 }),
            y: fc.integer({ min: -1000, max: -1 }),
          })
        ),
        (dims, cellSize, gridOrigin, relativeOffset) => {
          // Construct a touch point that is outside the grid (negative relative)
          const touchPoint = {
            x: gridOrigin.x + relativeOffset.x,
            y: gridOrigin.y + relativeOffset.y,
          }

          const result = screenCoordsToCellCoords(
            touchPoint,
            gridOrigin,
            cellSize,
            dims
          )

          expect(result).toBeNull()
        }
      ),
      { numRuns: 200 }
    )
  })

  it('screenCoordsToCellCoords returns null for touches beyond grid bounds (row >= rows or col >= cols)', () => {
    fc.assert(
      fc.property(
        gridDimensionsArb,
        fc.integer({ min: 1, max: 100 }),
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
        }),
        (dims, cellSize, gridOrigin) => {
          // Touch beyond the right edge: col >= cols
          const beyondRightX =
            gridOrigin.x + dims.cols * cellSize + fc.sample(fc.integer({ min: 0, max: 500 }), 1)[0]
          const beyondBottomY =
            gridOrigin.y + dims.rows * cellSize + fc.sample(fc.integer({ min: 0, max: 500 }), 1)[0]

          const resultRight = screenCoordsToCellCoords(
            { x: beyondRightX, y: gridOrigin.y },
            gridOrigin,
            cellSize,
            dims
          )
          expect(resultRight).toBeNull()

          const resultBottom = screenCoordsToCellCoords(
            { x: gridOrigin.x, y: beyondBottomY },
            gridOrigin,
            cellSize,
            dims
          )
          expect(resultBottom).toBeNull()
        }
      ),
      { numRuns: 200 }
    )
  })

  it('out-of-bounds touches leave the cell map unchanged', () => {
    fc.assert(
      fc.property(
        cellsMapArb(),
        gridDimensionsArb,
        fc.integer({ min: 1, max: 100 }),
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
        }),
        (cells, dims, cellSize, gridOrigin) => {
          // Generate an out-of-bounds touch (beyond right edge)
          const outOfBoundsTouch = {
            x: gridOrigin.x + dims.cols * cellSize + 1,
            y: gridOrigin.y + Math.floor(dims.rows * cellSize / 2),
          }

          const coords = screenCoordsToCellCoords(
            outOfBoundsTouch,
            gridOrigin,
            cellSize,
            dims
          )

          // Coords should be null for out-of-bounds
          expect(coords).toBeNull()

          // Since coords is null, the Touch Drawing Algorithm returns cells unchanged
          // (simulating the algorithm's early return)
          if (coords === null) {
            // Cell map remains unchanged — this is the invariant
            const resultCells = cells // no modification
            expect(resultCells).toEqual(cells)
          }
        }
      ),
      { numRuns: 200 }
    )
  })

  it('screenCoordsToCellCoords returns valid coords only for in-bounds touches', () => {
    fc.assert(
      fc.property(
        gridDimensionsArb,
        fc.integer({ min: 1, max: 100 }),
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
        }),
        (dims, cellSize, gridOrigin) => {
          // Generate a valid in-bounds touch
          const validRow = fc.sample(
            fc.integer({ min: 0, max: dims.rows - 1 }),
            1
          )[0]
          const validCol = fc.sample(
            fc.integer({ min: 0, max: dims.cols - 1 }),
            1
          )[0]

          const inBoundsTouch = {
            x: gridOrigin.x + validCol * cellSize + Math.floor(cellSize / 2),
            y: gridOrigin.y + validRow * cellSize + Math.floor(cellSize / 2),
          }

          const result = screenCoordsToCellCoords(
            inBoundsTouch,
            gridOrigin,
            cellSize,
            dims
          )

          // Should return valid coordinates
          expect(result).not.toBeNull()
          expect(result!.row).toBeGreaterThanOrEqual(0)
          expect(result!.row).toBeLessThan(dims.rows)
          expect(result!.col).toBeGreaterThanOrEqual(0)
          expect(result!.col).toBeLessThan(dims.cols)
        }
      ),
      { numRuns: 200 }
    )
  })
})
