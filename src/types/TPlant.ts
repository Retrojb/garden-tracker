/**
 * Core TypeScript interfaces and types for the Garden Tracker App.
 */

// ---------------------------------------------------------------------------
// Plant
// ---------------------------------------------------------------------------

interface IPlant {
  /** UUID, generated client-side */
  id: string
  /** User-defined display name */
  name?: string
  /** Botanical or common species name */
  species?: string
  /** Cultivar or variety name */
  variety?: string
  /** References the associated garden's ID */
  gardenId: string
  /** ISO 8601 creation timestamp */
  createdAt: string
  /** ISO 8601 last-updated timestamp */
  updatedAt: string
}
export type { IPlant }
