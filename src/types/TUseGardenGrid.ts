import type { ICellState, TDrawingTool } from './TGardenGrid'

interface UseGardenGridResult {
  /** Current cell state map: key = "row:col", value = ICellState */
  cells: Record<string, ICellState>
  /** Currently active drawing tool */
  activeTool: TDrawingTool
  /** Set the active drawing tool */
  setActiveTool: (tool: TDrawingTool) => void
  /** Handle a cell change based on the active tool and provided state */
  handleCellChange: (row: number, col: number, state: ICellState) => void
  /** Reset all cells to an empty state */
  clearGrid: () => void
  /** Export the current grid state as a base64-encoded PNG string */
  exportGridSnapshot: () => string
}

export type { UseGardenGridResult }
