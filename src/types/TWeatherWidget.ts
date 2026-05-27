type IWeatherWidgetProps = {
  /** Zip code override; if omitted, uses device location */
  zipCode?: string
  /** Compact mode for embedding in dashboard */
  compact?: boolean
}

export type { IWeatherWidgetProps }
