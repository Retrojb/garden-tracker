import type { ICreatePlantPayload, IUpdatePlantPayload } from './TPayload'
import type { IPlant } from './TPlant'

interface UsePlantsResult {
  plants: IPlant[]
  isLoading: boolean
  error: Error | null
  refreshPlants: () => Promise<void>
  createPlant: (payload: ICreatePlantPayload) => Promise<IPlant>
  updatePlant: (id: string, payload: IUpdatePlantPayload) => Promise<IPlant>
  deletePlant: (id: string) => Promise<void>
}

export type { UsePlantsResult }
