import { screenCoordsToCellCoords } from '../grid'

describe('screenCoordsToCellCoords', () => {
  const defaultOrigin = { x: 0, y: 0 }
  const defaultCellSize = 10
  const defaultDimensions = { rows: 4, cols: 4 }

  // ---------------------------------------------------------------------------
  // Valid coordinates
  // ---------------------------------------------------------------------------

  describe('valid coordinates', () => {
    it('returns { row: 0, col: 0 } for a touch at the grid origin', () => {
      const result = screenCoordsToCellCoords(
        { x: 0, y: 0 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 0, col: 0 })
    })

    it('returns correct cell for a touch in the middle of the grid', () => {
      const result = screenCoordsToCellCoords(
        { x: 25, y: 15 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 1, col: 2 })
    })

    it('returns the last valid cell for a touch at the bottom-right edge', () => {
      // Grid is 4x4 with cellSize 10, so max valid touch is just under (40, 40)
      const result = screenCoordsToCellCoords(
        { x: 39.9, y: 39.9 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 3, col: 3 })
    })

    it('accounts for a non-zero grid origin', () => {
      const origin = { x: 100, y: 200 }
      const result = screenCoordsToCellCoords(
        { x: 125, y: 215 },
        origin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 1, col: 2 })
    })

    it('handles fractional cell sizes', () => {
      const cellSize = 7.5
      const dimensions = { rows: 10, cols: 10 }
      const result = screenCoordsToCellCoords(
        { x: 16, y: 8 },
        defaultOrigin,
        cellSize,
        dimensions
      )
      // 16 / 7.5 = 2.13 → col 2, 8 / 7.5 = 1.06 → row 1
      expect(result).toEqual({ row: 1, col: 2 })
    })

    it('returns { row: 0, col: 0 } for a touch exactly at the grid origin with offset', () => {
      const origin = { x: 50, y: 50 }
      const result = screenCoordsToCellCoords(
        { x: 50, y: 50 },
        origin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 0, col: 0 })
    })
  })

  // ---------------------------------------------------------------------------
  // Out-of-bounds coordinates (returns null)
  // ---------------------------------------------------------------------------

  describe('out-of-bounds coordinates', () => {
    it('returns null for a touch to the left of the grid', () => {
      const result = screenCoordsToCellCoords(
        { x: -1, y: 5 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })

    it('returns null for a touch above the grid', () => {
      const result = screenCoordsToCellCoords(
        { x: 5, y: -1 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })

    it('returns null for a touch to the right of the grid', () => {
      // Grid width = 4 cols * 10 = 40, so x=40 is out of bounds (col 4 >= 4)
      const result = screenCoordsToCellCoords(
        { x: 40, y: 5 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })

    it('returns null for a touch below the grid', () => {
      // Grid height = 4 rows * 10 = 40, so y=40 is out of bounds (row 4 >= 4)
      const result = screenCoordsToCellCoords(
        { x: 5, y: 40 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })

    it('returns null for a touch before the grid origin (with offset)', () => {
      const origin = { x: 100, y: 100 }
      const result = screenCoordsToCellCoords(
        { x: 99, y: 99 },
        origin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })

    it('returns null for a touch far beyond the grid', () => {
      const result = screenCoordsToCellCoords(
        { x: 1000, y: 1000 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles a 1x1 grid', () => {
      const dimensions = { rows: 1, cols: 1 }
      const result = screenCoordsToCellCoords(
        { x: 5, y: 5 },
        defaultOrigin,
        defaultCellSize,
        dimensions
      )
      expect(result).toEqual({ row: 0, col: 0 })
    })

    it('returns null for any touch on a 1x1 grid at the cell boundary', () => {
      const dimensions = { rows: 1, cols: 1 }
      const result = screenCoordsToCellCoords(
        { x: 10, y: 0 },
        defaultOrigin,
        defaultCellSize,
        dimensions
      )
      expect(result).toBeNull()
    })

    it('handles touch exactly on a cell boundary (returns the next cell)', () => {
      const result = screenCoordsToCellCoords(
        { x: 10, y: 10 },
        defaultOrigin,
        defaultCellSize,
        defaultDimensions
      )
      expect(result).toEqual({ row: 1, col: 1 })
    })
  })
})
