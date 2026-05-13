/**
 * PlantCarousel
 *
 * A horizontally scrollable carousel of plant cards.
 * Each card is pressable and navigates to the plant detail screen.
 */

import { Avatar } from '@/src/components/Avatar'
import { Card } from '@/src/components/Card'
import { IPlant } from '@/src/types/TPlant'
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
    varietyText: 'text-xs text-gray-500 mt-1',
    emptyText: 'text-sm text-gray-400 px-4',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IPlantCarouselProps = {
  plants: IPlant[]
  onSeeAll?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PlantCarousel = ({ plants, onSeeAll }: IPlantCarouselProps) => {
  const router = useRouter()
  const {
    section,
    sectionHeader,
    sectionTitle,
    seeAll,
    scrollContent,
    cardWrapper,
    varietyText,
    emptyText,
  } = styles()

  return (
    <View className={section()}>
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>My Plants</Text>
        {onSeeAll && (
          <Text
            className={seeAll()}
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel="See all plants"
          >
            See all
          </Text>
        )}
      </View>

      {plants.length === 0 ? (
        <Text className={emptyText()}>
          No plants yet. Add one to get started.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName={scrollContent()}
          accessibilityLabel="Plants carousel"
        >
          {plants.map((plant) => (
            <View key={plant.id} className={cardWrapper()}>
              <Card
                title={plant.name}
                subtitle={plant.species}
                onPress={() => router.push(`/plants/${plant.id}`)}
              >
                {plant.variety ? (
                  <Text className={varietyText()}>{plant.variety}</Text>
                ) : null}
                <Avatar initials={plant.name.slice(0, 2).toUpperCase()} />
              </Card>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export { PlantCarousel }
export type { IPlantCarouselProps }
