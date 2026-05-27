// ---------------------------------------------------------------------------
// API Payload Types
// ---------------------------------------------------------------------------

import { TEventType } from './TCalendar'
import { IGardenDimensions, TGardenType } from './TGarden'
import { ICellState } from './TGardenGrid'

interface ICreateGardenPayload {
  name: string
  type: TGardenType
  dimensions: IGardenDimensions
}

interface IUpdateGardenPayload {
  name?: string
  type?: TGardenType
  dimensions?: IGardenDimensions
  cells?: Record<string, ICellState>
}

interface ICreatePlantPayload {
  name: string
  species: string
  variety?: string
}

interface IUpdatePlantPayload {
  name?: string
  species?: string
  variety?: string
}

interface ICreateEventPayload {
  plantId: string
  gardenId?: string
  eventType: TEventType
  date: string
  notes?: string
}

interface IUpdateEventPayload {
  eventType?: TEventType
  date?: string
  notes?: string
}

export type {
  ICreateEventPayload,
  ICreateGardenPayload,
  ICreatePlantPayload,
  IUpdateEventPayload,
  IUpdateGardenPayload,
  IUpdatePlantPayload
}

