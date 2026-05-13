// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

interface IWeatherResponse {
  /** City or locality name */
  location: string
  /** Temperature in Fahrenheit */
  temperatureF: number
  /** Temperature in Celsius */
  temperatureC: number
  /** Short condition label, e.g. "Partly Cloudy" */
  condition: string
  /** Icon code for rendering weather icon */
  iconCode: string
  /** Relative humidity percentage */
  humidity: number
  /** Wind speed in mph */
  windSpeedMph: number
  /** ISO 8601 timestamp of observation */
  observedAt: string
}

interface IWeatherOptions {
  /** 5-digit US zip code */
  zipCode?: string
  /** Use device GPS location instead of zip code */
  useDeviceLocation?: boolean
}

export type { IWeatherOptions, IWeatherResponse }
