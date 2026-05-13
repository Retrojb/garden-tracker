/**
 * Dashboard screen
 *
 * Shows a weather header followed by a horizontal carousel of gardens
 * and then a horizontal carousel of plants.
 */

import { MOCK_GARDENS } from '@/src/__mocks__/mockGarden'
import { MOCK_PLANTS } from '@/src/__mocks__/mockPlants'
import { GardenCarousel } from '@/src/components/GardenCarousel'
import { PlantCarousel } from '@/src/components/PlantCarousel'
import { WeatherHeader } from '@/src/features/WeatherHeader'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-gray-50',
    greeting: 'px-4 pt-5 pb-3',
    greetingText: 'text-2xl font-bold text-gray-900',
    greetingSubtext: 'text-sm text-gray-500 mt-0.5',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const DashboardScreen = () => {
  const router = useRouter()
  const { container, greeting, greetingText, greetingSubtext } = styles()

  return (
    <View className={container()}>
      <WeatherHeader initialZipCode="43206" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View className={greeting()}>
          <Text className={greetingText()}>Good morning 🌱</Text>
          <Text className={greetingSubtext()}>
            Here's what's growing today.
          </Text>
        </View>

        {/* Gardens carousel */}
        <GardenCarousel
          gardens={MOCK_GARDENS}
          onSeeAll={() => router.push('/(tabs)/gardens')}
        />

        {/* Plants carousel */}
        <PlantCarousel
          plants={MOCK_PLANTS}
          onSeeAll={() => router.push('/(tabs)/plants')}
        />
      </ScrollView>
    </View>
  )
}

export default DashboardScreen
