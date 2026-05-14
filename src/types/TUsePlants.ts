import type { IPlant } from './TPlant'

interface UsePlantsResult {
  plants: IPlant[]
  isLoading: boolean
  error: Error | null
  refreshPlants: () => Promise<void>
}

export type { UsePlantsResult }
