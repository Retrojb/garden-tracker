// ---------------------------------------------------------------------------
// Garden
// ---------------------------------------------------------------------------

import type { ICellState } from './TGardenGrid'

type TGardenType =
  | 'raised_bed'
  | 'in_ground'
  | 'container'
  | 'greenhouse'
  | 'other'

interface IGardenDimensions {
  /** Width in inches */
  widthInches: number
  /** Height/depth in inches */
  heightInches: number
  /** Lenght/depth in inches */
  lengthInches: number
}

interface IGarden {
  /** UUID */
  id: string
  /** User-defined garden name */
  name: string
  /** Garden type */
  type: TGardenType
  /** Human-readable size label, e.g. "4x8 ft" */
  size: string
  /** Precise dimensions for grid rendering */
  dimensions: IGardenDimensions
  /** Persisted grid cell state (sparse map) */
  cells?: Record<string, ICellState>
  /** ISO 8601 creation timestamp */
  createdAt: string
  /** ISO 8601 last-updated timestamp */
  updatedAt: string
}

export type { IGarden, IGardenDimensions, TGardenType }
