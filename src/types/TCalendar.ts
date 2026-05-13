type TEventType =
  | 'planted'
  | 'fertilized'
  | 'harvested'
  | 'watered'
  | 'pruned'
  | 'custom'

interface ICalendarEvent {
  /** UUID */
  id: string
  /** Associated plant */
  plantId: string
  /** Associated garden (optional) */
  gardenId?: string
  /** Type of garden event */
  eventType: TEventType
  /** ISO 8601 date string (date only, no time) */
  date: string
  /** Optional user notes */
  notes?: string
  /** ISO 8601 creation timestamp */
  createdAt: string
  /** ISO 8601 last-updated timestamp */
  updatedAt: string
}

export type { ICalendarEvent, TEventType }
