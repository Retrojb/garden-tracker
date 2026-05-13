// ---------------------------------------------------------------------------
// Garden Grid / Drawing
// ---------------------------------------------------------------------------

type TDrawingTool = 'draw' | 'erase' | 'place_plant' | 'select'

interface ICellState {
  /** Whether the cell is filled */
  filled: boolean
  /** Plant placed in this cell (optional) */
  plantId?: string
  /** Fill color override (optional) */
  color?: string
}

export type { ICellState, TDrawingTool }
