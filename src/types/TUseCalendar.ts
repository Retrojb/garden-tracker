import type { ICalendarEvent } from './TCalendar'
import type { ICreateEventPayload, IUpdateEventPayload } from './TPayload'

interface UseCalendarResult {
  events: ICalendarEvent[]
  isLoading: boolean
  error: Error | null
  refreshEvents: () => Promise<void>
  createEvent: (payload: ICreateEventPayload) => Promise<ICalendarEvent>
  updateEvent: (
    id: string,
    payload: IUpdateEventPayload
  ) => Promise<ICalendarEvent>
  deleteEvent: (id: string) => Promise<void>
}

export type { UseCalendarResult }
