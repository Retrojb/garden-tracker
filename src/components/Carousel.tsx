/**
 * Carousel
 *
 * A generic horizontally scrollable carousel with a title header
 * and optional "See all" action.
 */

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
    emptyText: 'text-sm text-gray-400 px-4',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ICarouselProps = {
  /** Section title displayed above the carousel */
  title: string
  /** Content to render inside the horizontal scroll */
  children: React.ReactNode
  /** Callback when "See all" is pressed */
  onSeeAll?: () => void
  /** Accessibility label for the scroll container */
  accessibilityLabel?: string
  /** Text shown when children is empty/null */
  emptyMessage?: string
  /** Whether the carousel has items to display */
  isEmpty?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Carousel = ({
  title,
  children,
  onSeeAll,
  accessibilityLabel,
  emptyMessage,
  isEmpty = false,
}: ICarouselProps) => {
  const {
    section,
    sectionHeader,
    sectionTitle,
    seeAll,
    scrollContent,
    emptyText,
  } = styles()

  return (
    <View className={section()}>
      <View className={sectionHeader()}>
        <Text className={sectionTitle()}>{title}</Text>
        {onSeeAll && (
          <Text
            className={seeAll()}
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title.toLowerCase()}`}
          >
            See all
          </Text>
        )}
      </View>

      {isEmpty && emptyMessage ? (
        <Text className={emptyText()}>{emptyMessage}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName={scrollContent()}
            accessibilityLabel={accessibilityLabel ?? `${title} carousel`}
        >
          {children}
        </ScrollView>
      )}
    </View>
  )
}

export { Carousel }
export type { ICarouselProps }

