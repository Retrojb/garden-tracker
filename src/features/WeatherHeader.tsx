/**
 * WeatherHeader
 *
 * A collapsible header that displays the current temperature for a zip code.
 * Tapping the header toggles between a compact single-line summary and an
 * expanded view that also shows condition, humidity, and wind speed.
 *
 * The zip code is entered inline via a small text input that appears when the
 * user taps the location label.
 */

import React, { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { tv } from 'tailwind-variants'

import { useWeather } from '@/src/hooks/useWeather'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'bg-sky-600 overflow-hidden',
    collapseRow: 'flex-row items-center justify-between px-4 py-3',
    tempText: 'text-white text-2xl font-bold',
    conditionText: 'text-sky-100 text-sm ml-2 flex-1',
    chevron: 'text-white text-base ml-2',
    expandedBody: 'px-4 pb-4',
    detailRow: 'flex-row justify-between mt-1',
    detailLabel: 'text-sky-200 text-xs',
    detailValue: 'text-white text-xs font-medium',
    locationRow: 'flex-row items-center mt-2',
    locationLabel: 'text-sky-200 text-xs mr-1',
    zipInput: 'text-white text-xs border-b border-sky-300 min-w-[60px] pb-0.5',
    errorText: 'text-red-300 text-xs mt-1',
    loadingRow: 'flex-row items-center px-4 py-3',
    loadingText: 'text-sky-100 text-sm ml-2',
  },
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPAND_DURATION_MS = 250
const COLLAPSED_HEIGHT = 0
const EXPANDED_HEIGHT = 110

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherHeaderProps {
  /** Initial zip code to load weather for */
  initialZipCode?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WeatherHeader = ({ initialZipCode = '' }: WeatherHeaderProps) => {
  const [zipCode, setZipCode] = useState(initialZipCode)
  const [committedZip, setCommittedZip] = useState(initialZipCode)
  const [isEditingZip, setIsEditingZip] = useState(!initialZipCode)
  const [isExpanded, setIsExpanded] = useState(true)

  const inputRef = useRef<TextInput>(null)

  const { weather, isLoading, error } = useWeather(
    committedZip ? { zipCode: committedZip } : {}
  )

  // Animated height for the expanded body section
  const expandedHeight = useSharedValue<number>(
    isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT
  )

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: expandedHeight.value,
    overflow: 'hidden',
  }))

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleExpanded = useCallback(() => {
    const next = !isExpanded
    setIsExpanded(next)
    expandedHeight.value = withTiming(
      next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      { duration: EXPAND_DURATION_MS }
    )
  }, [isExpanded, expandedHeight])

  const commitZip = useCallback(() => {
    const trimmed = zipCode.trim()
    if (/^\d{5}$/.test(trimmed)) {
      setCommittedZip(trimmed)
      setIsEditingZip(false)
    }
  }, [zipCode])

  const handleZipSubmit = useCallback(() => {
    commitZip()
  }, [commitZip])

  const handleLocationPress = useCallback(() => {
    setIsEditingZip(true)
    // Focus the input on the next tick so it's mounted
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  const tempDisplay = weather ? `${Math.round(weather.temperatureF)}°F` : '99°F'
  const conditionDisplay = weather?.condition ?? ''
  const locationDisplay = weather?.location ?? committedZip ?? 'Enter zip'

  const {
    container,
    collapseRow,
    tempText,
    conditionText,
    chevron,
    expandedBody,
    detailRow,
    detailLabel,
    detailValue,
    locationRow,
    locationLabel,
    zipInput,
    errorText,
    loadingRow,
    loadingText,
  } = styles()

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View className={container()}>
        <View className={loadingRow()}>
          <ActivityIndicator color="#fff" size="small" />
          <Text className={loadingText()}>Loading weather…</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={container()}>
      {/* ── Collapsed / always-visible row ── */}
      <Pressable
        className={collapseRow()}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Collapse weather' : 'Expand weather'}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text className={tempText()}>{tempDisplay}</Text>
        {conditionDisplay ? (
          <Text className={conditionText()} numberOfLines={1}>
            {conditionDisplay}
          </Text>
        ) : null}
        <Text className={chevron()}>{isExpanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* ── Expanded body ── */}
      <Animated.View style={animatedBodyStyle}>
        <View className={expandedBody()}>
          {error ? (
            <Text className={errorText()}>
              {error.message ?? 'Unable to load weather'}
            </Text>
          ) : null}

          {weather ? (
            <>
              <View className={detailRow()}>
                <Text className={detailLabel()}>Humidity</Text>
                <Text className={detailValue()}>{weather.humidity}%</Text>
              </View>
              <View className={detailRow()}>
                <Text className={detailLabel()}>Wind</Text>
                <Text className={detailValue()}>
                  {weather.windSpeedMph} mph
                </Text>
              </View>
            </>
          ) : null}

          {/* ── Location / zip input ── */}
          <View className={locationRow()}>
            <Text className={locationLabel()}>📍</Text>
            {isEditingZip ? (
              <TextInput
                ref={inputRef}
                className={zipInput()}
                value={zipCode}
                onChangeText={setZipCode}
                onSubmitEditing={handleZipSubmit}
                onBlur={commitZip}
                placeholder="12345"
                placeholderTextColor="#7dd3fc"
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="done"
                accessibilityLabel="Enter zip code"
              />
            ) : (
              <Pressable
                onPress={handleLocationPress}
                accessibilityRole="button"
                accessibilityLabel={`Location: ${locationDisplay}. Tap to change zip code`}
              >
                <Text className={detailValue()}>{locationDisplay}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

export { WeatherHeader }
