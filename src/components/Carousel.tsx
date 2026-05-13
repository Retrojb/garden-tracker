/**
 * GardenCarousel
 *
 * A horizontally scrollable carousel of garden cards.
 * Each card is pressable and navigates to the garden detail screen.
 */

import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    section: 'mb-6',
    sectionHeader: 'flex-row items-center justify-between px-4 mb-2',
    sectionTitle: 'text-lg font-bold text-gray-800',
    seeAll: 'text-sm text-green-600 font-medium',
    scrollContent: 'px-2',
    cardWrapper: 'w-44',
    typeLabel: 'text-xs text-gray-500 capitalize mt-1',
    emptyText: 'text-sm text-gray-400 px-4',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ICarouselProps = {
  children: React.ReactElement;
  onSeeAll?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Carousel = ({ children, onSeeAll }: ICarouselProps) => {
  const router = useRouter()
  const {
    section,
    sectionHeader,
    sectionTitle,
    seeAll,
    scrollContent,
    cardWrapper,
    typeLabel,
    emptyText,
  } = styles()

  return (
    <View className={section()}>
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>My Gardens</Text>
        {onSeeAll && (
          <Text
            className={seeAll()}
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel="See all gardens"
          >
            See all
          </Text>
        )}
      </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName={scrollContent()}
          accessibilityLabel="Gardens carousel"
        >
          {children}
        </ScrollView>
    </View>
  )
}

export { Carousel }
export type { ICarouselProps }

