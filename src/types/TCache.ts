import { IWeatherResponse } from './TWeather'

interface IWeatherCacheEntry {
  data: IWeatherResponse
  timestamp: number
}

export type { IWeatherCacheEntry }
