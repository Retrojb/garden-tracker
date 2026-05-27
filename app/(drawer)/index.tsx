/**
 * Dashboard screen
 *
 * Shows a weather widget at the top (using device location or saved zip code),
 * summary counts for gardens and plants, and quick-access carousels.
 *
 * Requirements: 6.1, 6.2, 6.9
 */

import { Card } from '@/src/components/Card'
import { Carousel } from '@/src/components/Carousel'
import { GardenFormModal } from '@/src/components/GardenFormModal'
import { PlantFormModal } from '@/src/components/PlantFormModal'
import { WeatherWidget } from '@/src/components/WeatherWidget'
import { useGardens } from '@/src/hooks/useGardens'
import { usePlants } from '@/src/hooks/usePlants'
import { get, set } from '@/src/lib/storage'
import { ICreateGardenPayload, ICreatePlantPayload } from '@/src/types/TPayload'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZIP_CODE_STORAGE_KEY = 'user_zip_code'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-gray-50',
    weatherSection: 'px-4 pt-4',
    greeting: 'px-4 pt-5 pb-3',
    greetingText: 'text-2xl text-gray-900 font-manrope-bold',
    greetingSubtext: 'text-sm text-gray-500 mt-0.5 font-manrope-regular',
    summaryRow: 'flex-row px-4 gap-3 mb-4',
    summaryCard: 'flex-1 rounded-2xl bg-mauve-300 border-4 border-indigo-200 p-4 items-center shadow-md',
    summaryCount: 'text-3xl text-gray-900 font-manrope-bold',
    summaryLabel: 'text-sm text-gray-600 mt-1 font-manrope-regular',
    zipPromptContainer: 'mx-4 mt-3 rounded-2xl bg-amber-50 border border-amber-200 p-4',
    zipPromptText: 'text-sm text-amber-800 mb-2 font-manrope-regular',
    zipInputRow: 'flex-row items-center gap-2',
    zipInput:
      'flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white font-manrope-regular',
    zipSubmitButton: 'bg-amber-500 rounded-lg px-4 py-2',
    zipSubmitText: 'text-white text-sm font-manrope-bold',
    cardWrapper: 'w-44',
    typeLabel: 'text-xs text-gray-500 capitalize mt-1 font-manrope-regular',
    varietyText: 'text-xs text-gray-500 mt-1 font-manrope-regular',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const DashboardScreen = () => {
  const router = useRouter()
  const { plants, createPlant } = usePlants()
  const { gardens, createGarden } = useGardens()

  const [plantModalVisible, setPlantModalVisible] = useState(false)
  const [gardenModalVisible, setGardenModalVisible] = useState(false)

  // Location / zip code state
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [savedZipCode, setSavedZipCode] = useState<string | null>(null)
  const [zipInput, setZipInput] = useState('')
  const [locationChecked, setLocationChecked] = useState(false)

  // ---------------------------------------------------------------------------
  // Check location permission and load saved zip code on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkLocationPermission = async () => {
      // First check if user already has a saved zip code preference
      const storedZip = get<string>(ZIP_CODE_STORAGE_KEY)
      if (storedZip) {
        setSavedZipCode(storedZip)
        setLocationChecked(true)
        return
      }

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        // Req 6.9: prompt for zip code if location permission denied
        setLocationPermissionDenied(true)
      }
      setLocationChecked(true)
    }

    void checkLocationPermission()
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleZipSubmit = useCallback(() => {
    const trimmed = zipInput.trim()
    if (/^\d{5}$/.test(trimmed)) {
      // Save preference to MMKV (Req 6.9)
      set<string>(ZIP_CODE_STORAGE_KEY, trimmed)
      setSavedZipCode(trimmed)
      setLocationPermissionDenied(false)
    }
  }, [zipInput])

  const handlePlantCreate = useCallback(
    async (payload: ICreatePlantPayload) => {
      await createPlant(payload)
    },
    [createPlant]
  )

  const handleGardenCreate = useCallback(
    async (payload: ICreateGardenPayload) => {
      await createGarden(payload)
    },
    [createGarden]
  )

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const {
    container,
    weatherSection,
    greeting,
    greetingText,
    greetingSubtext,
    summaryRow,
    summaryCard,
    summaryCount,
    summaryLabel,
    zipPromptContainer,
    zipPromptText,
    zipInputRow,
    zipInput: zipInputStyle,
    zipSubmitButton,
    zipSubmitText,
    cardWrapper,
    typeLabel,
    varietyText,
  } = styles()

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View className={container()}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Weather Widget */}
        <View className={weatherSection()}>
          {locationChecked && (
            <WeatherWidget
              zipCode={savedZipCode ?? undefined}
              compact={false}
            />
          )}
        </View>

        {/* Zip code prompt when location permission denied and no saved zip */}
        {locationPermissionDenied && !savedZipCode && (
          <View className={zipPromptContainer()}>
            <Text className={zipPromptText()}>
              Location access was denied. Enter your zip code to see local
              weather.
            </Text>
            <View className={zipInputRow()}>
              <TextInput
                className={zipInputStyle()}
                value={zipInput}
                onChangeText={setZipInput}
                onSubmitEditing={handleZipSubmit}
                placeholder="Enter zip code"
                placeholderTextColor="#92400e"
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="done"
                accessibilityLabel="Zip code input"
              />
              <Pressable
                className={zipSubmitButton()}
                onPress={handleZipSubmit}
                accessibilityRole="button"
                accessibilityLabel="Save zip code"
              >
                <Text className={zipSubmitText()}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Greeting */}
        <View className={greeting()}>
          <Text className={greetingText()}>Good morning 🌱</Text>
          <Text className={greetingSubtext()}>
            Here's what's growing today.
          </Text>
        </View>

        {/* Summary counts */}
        <View className={summaryRow()}>
          <Pressable
            className={summaryCard()}
            onPress={() => router.push('/(drawer)/gardens')}
            accessibilityRole="button"
            accessibilityLabel={`${gardens.length} Gardens`}
          >
            <Text className={summaryCount()}>{gardens.length}</Text>
            <Text className={summaryLabel()}>Gardens</Text>
          </Pressable>
          <Pressable
            className={summaryCard()}
            onPress={() => router.push('/(drawer)/plants')}
            accessibilityRole="button"
            accessibilityLabel={`${plants.length} Plants`}
          >
            <Text className={summaryCount()}>{plants.length}</Text>
            <Text className={summaryLabel()}>Plants</Text>
          </Pressable>
        </View>

        {/* Gardens carousel */}
        <Carousel
          title="My Gardens"
          onSeeAll={() => router.push('/(drawer)/gardens')}
          isEmpty={gardens.length === 0}
          emptyMessage="No gardens yet. Add one to get started."
          accessibilityLabel="Gardens carousel"
        >
          {gardens.map((garden) => (
            <View key={garden.id} className={cardWrapper()}>
              <Card
                title={garden.name}
                subtitle={
                  garden.size
                    ? `${garden.size} · ${garden.type.replace('_', ' ')}`
                    : garden.type.replace('_', ' ')
                }
                onPress={() => router.push(`/gardens/${garden.id}`)}
              >
                <Text className={typeLabel()}>
                  {garden.type.replace(/_/g, ' ')}
                </Text>
              </Card>
            </View>
          ))}
          <Card
            title="New Garden?"
            subtitle="Add a new garden"
            onPress={() => setGardenModalVisible(true)}
          />
          <View>
            <GardenFormModal
              visible={gardenModalVisible}
              onClose={() => setGardenModalVisible(false)}
              onSubmit={handleGardenCreate}
            />
          </View>
        </Carousel>

        {/* Plants carousel */}
        <Carousel
          title="My Plants"
          onSeeAll={() => router.push('/(drawer)/plants')}
          isEmpty={plants.length === 0}
          emptyMessage="No plants yet. Add one to get started."
          accessibilityLabel="Plants carousel"
        >
          {gardens.map((garden) => (
            <View key={garden.id} className={cardWrapper()}>
              <Card
                title={garden.name}
                subtitle={garden.type.replace('_', ' ')}
                onPress={() => router.push(`/gardens/${garden.id}`)}
              />
            </View>
          ))}
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
              </Card>
            </View>
          ))}
          <Card
            title="New Plant?"
            subtitle="Add a new plant"
            onPress={() => setPlantModalVisible(true)}
          />
          <View>
            <PlantFormModal
              visible={plantModalVisible}
              onClose={() => setPlantModalVisible(false)}
              onSubmit={handlePlantCreate}
            />
          </View>
        </Carousel>
      </ScrollView>
    </View>
  )
}

export default DashboardScreen
