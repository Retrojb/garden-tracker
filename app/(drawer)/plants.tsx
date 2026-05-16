/**
 * Plants screen
 *
 * Lists all plants from the usePlants hook and provides a FAB to open the
 * PlantFormModal for creating a new plant.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { Fab } from '@/src/components/Fab'
import { PlantFormModal } from '@/src/components/PlantFormModal'
import { WeatherHeader } from '@/src/features/WeatherHeader'
import { usePlants } from '@/src/hooks/usePlants'
import type { ICreatePlantPayload } from '@/src/types/TPayload'
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
    cardSpecies: 'text-sm text-gray-500 mt-0.5 italic',
    cardVariety: 'text-xs text-gray-400 mt-1',
    emptyWrap: 'flex-1 items-center justify-center py-20',
    emptyText: 'text-gray-400 text-sm mt-2',
    emptyTitle: 'text-gray-600 font-semibold text-base',
    errorBanner:
      'mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3',
    errorText: 'text-sm text-red-600',
    loadingWrap: 'flex-1 items-center justify-center py-20',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const PlantsScreen = () => {
  const router = useRouter()
  const { plants, isLoading, error, createPlant } = usePlants()
  const [modalVisible, setModalVisible] = useState(false)
  const s = styles()

  const handleCreate = async (payload: ICreatePlantPayload) => {
    await createPlant(payload)
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
      {isLoading && plants.length === 0 ? (
        <View className={s.loadingWrap()}>
          <ActivityIndicator color="#4b7c59" />
        </View>
      ) : plants.length === 0 ? (
        <View className={s.emptyWrap()}>
          <Text className={s.emptyTitle()}>No plants yet</Text>
          <Text className={s.emptyText()}>Tap + to add your first plant</Text>
        </View>
      ) : (
            <ScrollView
              className={s.list()}
              contentContainerClassName={s.listContent()}
              showsVerticalScrollIndicator={false}
            >
              {plants.map((plant) => (
                <Pressable
                  key={plant.id}
                  className={s.card()}
              onPress={() => router.push(`/plants/${plant.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${plant.name}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className={s.cardName()}>{plant.name}</Text>
              <Text className={s.cardSpecies()}>{plant.species}</Text>
              {plant.variety ? (
                <Text className={s.cardVariety()}>{plant.variety}</Text>
              ) : null}
            </Pressable>
          ))}
            </ScrollView>
      )}

      {/* FAB */}
      <Fab
        iconName="plus"
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add plant"
      />

      {/* Create plant modal */}
      <PlantFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </View>
  )
}

export default PlantsScreen
