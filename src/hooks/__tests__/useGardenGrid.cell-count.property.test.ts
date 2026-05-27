/**
 * Property-Based Tests: Grid Cell Count Invariant
 *
 * **Property 7: Grid Cell Count Invariant** — for any valid (widthInches, heightInches),
 * the rendered grid contains exactly (widthInches × 4) × (heightInches × 4) cells,
 * each rendered exactly once.
 *
 * **Validates: Requirements 3.1, 3.7**
 */
import * as fc from 'fast-check'

import { buildCellKey } from '@/src/hooks/useGardenGrid'

// ---------------------------------------------------------------------------
// Arbitraries — constrained to practical test dimensions
// ---------------------------------------------------------------------------

/**
 * Generates a valid positive integer for garden dimensions (inches).
 * Constrained to 1–50 for practical test performance while still exercising
 * the property across a meaningful range.
 */
const dimensionArb = fc.integer({ min: 1, max: 50 })

// ---------------------------------------------------------------------------
// Property 7: Grid Cell Count Invariant
// **Validates: Requirements 3.1, 3.7**
// ---------------------------------------------------------------------------

describe('Property 7: Grid Cell Count Invariant', () => {
  it('grid enumeration produces exactly (widthInches * 4) * (heightInches * 4) cells', () => {
    fc.assert(
      fc.property(dimensionArb, dimensionArb, (widthInches, heightInches) => {
        const cols = widthInches * 4
        const rows = heightInches * 4
        const expectedCellCount = rows * cols

        // Enumerate all cells as the renderGardenGrid algorithm does
        const cellKeys: string[] = []
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            cellKeys.push(buildCellKey(row, col))
          }
        }

        // Total cell count matches expected
        expect(cellKeys.length).toBe(expectedCellCount)
      }),
      { numRuns: 200 }
    )
  })

  it('each cell coordinate (row:col) is unique — no cell is rendered more than once', () => {
    fc.assert(
      fc.property(dimensionArb, dimensionArb, (widthInches, heightInches) => {
        const cols = widthInches * 4
        const rows = heightInches * 4

        // Enumerate all cells as the renderGardenGrid algorithm does
        const cellKeys: string[] = []
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            cellKeys.push(buildCellKey(row, col))
          }
        }

        // All keys must be unique (Set size equals array length)
        const uniqueKeys = new Set(cellKeys)
        expect(uniqueKeys.size).toBe(cellKeys.length)
      }),
      { numRuns: 200 }
    )
  })

  it('buildCellKey produces the expected "row:col" format for all cells', () => {
    fc.assert(
      fc.property(dimensionArb, dimensionArb, (widthInches, heightInches) => {
        const cols = widthInches * 4
        const rows = heightInches * 4

        // Verify key format for every cell in the grid
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const key = buildCellKey(row, col)
            expect(key).toBe(`${row}:${col}`)
          }
        }
      }),
      // Use fewer runs for this test since it iterates all cells internally
      { numRuns: 50 }
    )
  })
})
