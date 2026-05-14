/**
 * Gardens screen
 *
 * Lists all gardens from the useGardens hook and provides a FAB to open the
 * GardenFormModal for creating a new garden.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { Fab } from '@/src/components/Fab'
import { GardenFormModal } from '@/src/components/GardenFormModal'
import { WeatherHeader } from '@/src/features/WeatherHeader'
import { useGardens } from '@/src/hooks/useGardens'
import type { ICreateGardenPayload } from '@/src/types/TPayload'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-white',
    list: 'flex-1',
    listContent: 'px-4 pt-3 pb-28',
    card: 'mb-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm',
    cardName: 'text-base font-semibold text-gray-900',
    cardMeta: 'text-sm text-gray-500 mt-0.5 capitalize',
    cardDims: 'text-xs text-gray-400 mt-1',
    emptyWrap: 'flex-1 items-center justify-center py-20',
    emptyText: 'text-gray-400 text-sm mt-2',
    emptyTitle: 'text-gray-600 font-semibold text-base',
    errorBanner:
      'mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3',
    errorText: 'text-sm text-red-600',
    loadingWrap: 'flex-1 items-center justify-center py-20',
    fab: 'absolute bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 items-center justify-center shadow-lg',
    fabText: 'text-white text-3xl leading-none',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const GardensScreen = () => {
  const router = useRouter()
  const { gardens, isLoading, error, createGarden } = useGardens()
  const [modalVisible, setModalVisible] = useState(false)
  const s = styles()

  const handleCreate = async (payload: ICreateGardenPayload) => {
    await createGarden(payload)
  }

  const formatDims = (widthInches: number, heightInches: number) => {
    const w = (widthInches / 12).toFixed(widthInches % 12 === 0 ? 0 : 1)
    const h = (heightInches / 12).toFixed(heightInches % 12 === 0 ? 0 : 1)
    return `${w} × ${h} ft  (${widthInches}" × ${heightInches}")`
  }

  return (
    <View className={s.container()}>
      <WeatherHeader initialZipCode="43206" />

      {/* Error banner */}
      {error ? (
        <View className={s.errorBanner()}>
          <Text className={s.errorText()}>{error.message}</Text>
        </View>
      ) : null}

      {/* Loading */}
      {isLoading && gardens.length === 0 ? (
        <View className={s.loadingWrap()}>
          <ActivityIndicator color="#4b7c59" />
        </View>
      ) : gardens.length === 0 ? (
        <View className={s.emptyWrap()}>
          <Text className={s.emptyTitle()}>No gardens yet</Text>
          <Text className={s.emptyText()}>Tap + to add your first garden</Text>
        </View>
      ) : (
        <ScrollView
          className={s.list()}
          contentContainerClassName={s.listContent()}
          showsVerticalScrollIndicator={false}
        >
          {gardens.map((garden) => (
            <Pressable
              key={garden.id}
              className={s.card()}
              onPress={() => router.push(`/gardens/${garden.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${garden.name}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className={s.cardName()}>{garden.name}</Text>
              <Text className={s.cardMeta()}>
                {garden.type.replace(/_/g, ' ')}
              </Text>
              <Text className={s.cardDims()}>
                {formatDims(
                  garden.dimensions.widthInches,
                  garden.dimensions.heightInches
                )}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <Fab
        iconName="plus"
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add garden"
      />

      {/* Create garden modal */}
      <GardenFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </View>
  )
}

export default GardensScreen
