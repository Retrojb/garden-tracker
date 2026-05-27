/**
 * Garden grid coordinate utilities
 */

interface IPoint {
  readonly x: number
  readonly y: number
}

interface IGridDimensions {
  readonly rows: number
  readonly cols: number
}

interface ICellCoords {
  readonly row: number
  readonly col: number
}

/**
 * Converts absolute screen coordinates to grid cell coordinates.
 *
 * The algorithm:
 * 1. Subtracts the grid origin from the touch point to get relative coordinates
 * 2. Divides by cell size and floors to get row/col indices
 * 3. Returns null if the resulting row/col is outside bounds (negative or >= rows/cols)
 *
 * @param touchPoint - Absolute screen coordinates of the touch
 * @param gridOrigin - Absolute screen coordinates of the grid's top-left corner
 * @param cellSize - Size of each cell in screen units (pixels/points)
 * @param gridDimensions - Total number of rows and columns in the grid
 * @returns Cell coordinates `{ row, col }` or `null` if outside grid bounds
 */
const screenCoordsToCellCoords = (
  touchPoint: IPoint,
  gridOrigin: IPoint,
  cellSize: number,
  gridDimensions: IGridDimensions
): ICellCoords | null => {
  // Compute position relative to grid origin
  const relativeX = touchPoint.x - gridOrigin.x
  const relativeY = touchPoint.y - gridOrigin.y

  // Convert to cell indices
  const col = Math.floor(relativeX / cellSize)
  const row = Math.floor(relativeY / cellSize)

  // Bounds check: reject if outside grid
  if (row < 0 || row >= gridDimensions.rows) {
    return null
  }

  if (col < 0 || col >= gridDimensions.cols) {
    return null
  }

  return { row, col }
}

export { screenCoordsToCellCoords }
export type { ICellCoords, IGridDimensions, IPoint }

