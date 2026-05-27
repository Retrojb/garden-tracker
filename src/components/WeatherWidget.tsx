/**
 * WeatherWidget component
 *
 * Displays current weather conditions for the user's location or a given zip code.
 * Supports a compact mode for embedding in dashboards.
 *
 * Requirements: 6.3, 6.8
 */

import React from 'react'
import { Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import { useWeather } from '@/src/hooks/useWeather'
import type { IWeatherWidgetProps } from '@/src/types/TWeatherWidget'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const widgetStyle = tv({
  slots: {
    container: 'rounded-2xl bg-mauve-300 border-4 border-indigo-200 shadow-md',
    row: 'flex-row items-center',
    iconContainer: 'items-center justify-center',
    iconText: 'text-center',
    temperatureText: 'font-bold text-gray-900',
    conditionText: 'text-gray-600',
    locationText: 'text-gray-500',
    errorContainer: 'items-center justify-center',
    errorText: 'text-red-600 text-center',
    skeletonBlock: 'rounded-md bg-gray-200',
  },
  variants: {
    compact: {
      true: {
        container: 'p-3',
        iconText: 'text-2xl',
        temperatureText: 'text-lg ml-2',
        conditionText: 'text-sm ml-2',
        locationText: 'text-xs mt-1',
      },
      false: {
        container: 'p-5',
        iconText: 'text-4xl',
        temperatureText: 'text-2xl ml-3',
        conditionText: 'text-base mt-1',
        locationText: 'text-sm mt-2',
      },
    },
  },
  defaultVariants: {
    compact: false,
  },
})

// ---------------------------------------------------------------------------
// Weather icon mapping
// ---------------------------------------------------------------------------

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
}

const DEFAULT_ICON = '🌤️'

const getWeatherIcon = (iconCode: string): string =>
  WEATHER_ICONS[iconCode] ?? DEFAULT_ICON

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const LoadingSkeleton = ({ compact }: { compact: boolean }) => {
  const { container, skeletonBlock } = widgetStyle({ compact })

  const iconSize = compact ? 'h-6 w-6' : 'h-10 w-10'
  const tempSize = compact ? 'h-5 w-16 ml-2' : 'h-7 w-20 ml-3'
  const conditionSize = compact ? 'h-4 w-24 mt-1' : 'h-5 w-32 mt-2'

  return (
    <View
      className={container()}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading weather data"
    >
      <View className="flex-row items-center">
        <View className={`${skeletonBlock()} ${iconSize}`} />
        <View className={`${skeletonBlock()} ${tempSize}`} />
      </View>
      <View className={`${skeletonBlock()} ${conditionSize}`} />
    </View>
  )
}

const ErrorState = ({ compact, message }: { compact: boolean; message: string }) => {
  const { container, errorContainer, errorText } = widgetStyle({ compact })

  return (
    <View
      className={container()}
      accessibilityRole="alert"
      accessibilityLabel={`Weather error: ${message}`}
    >
      <View className={errorContainer()}>
        <Text className="text-2xl mb-1">⚠️</Text>
        <Text className={errorText()}>
          {message}
        </Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const WeatherWidget = ({ zipCode, compact = false }: IWeatherWidgetProps) => {
  const { weather, isLoading, error } = useWeather({
    zipCode,
    useDeviceLocation: !zipCode,
  })

  if (isLoading) {
    return <LoadingSkeleton compact={compact} />
  }

  if (error) {
    return (
      <ErrorState
        compact={compact}
        message="Unable to load weather data"
      />
    )
  }

  if (!weather) {
    return (
      <ErrorState
        compact={compact}
        message="No weather data available"
      />
    )
  }

  const {
    container,
    row,
    iconText,
    temperatureText,
    conditionText,
    locationText,
  } = widgetStyle({ compact })

  const icon = getWeatherIcon(weather.iconCode)

  return (
    <View
      className={container()}
      accessibilityRole="summary"
      accessibilityLabel={`Weather in ${weather.location}: ${Math.round(weather.temperatureF)}°F, ${weather.condition}`}
    >
      <View className={row()}>
        <Text className={iconText()} accessibilityLabel={weather.condition}>
          {icon}
        </Text>
        <Text className={temperatureText()}>
          {Math.round(weather.temperatureF)}°F
        </Text>
      </View>
      <Text className={conditionText()}>{weather.condition}</Text>
      {!compact && (
        <Text className={locationText()}>{weather.location}</Text>
      )}
    </View>
  )
}

export { WeatherWidget }
