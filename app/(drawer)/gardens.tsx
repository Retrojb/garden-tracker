/**
 * Gardens screen
 *
 * Lists all gardens using FlashList and GardenCard. Provides a FAB to open
 * a FormModal for creating/editing gardens with inline validation.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import { Fab } from '@/src/components/Fab'
import { FormField } from '@/src/components/FormField'
import { FormModal } from '@/src/components/FormModal'
import { GardenCard } from '@/src/components/GardenCard'
import { SubmitButton } from '@/src/components/SubmitButton'
import { WeatherHeader } from '@/src/features/WeatherHeader'
import { useGardens } from '@/src/hooks/useGardens'
import type { IGarden, TGardenType } from '@/src/types/TGarden'
import type { ICreateGardenPayload } from '@/src/types/TPayload'
import { validateGarden } from '@/src/utils/validation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GARDEN_TYPES: TGardenType[] = [
  'raised_bed',
  'in_ground',
  'container',
  'greenhouse',
  'other',
]

const GARDEN_TYPE_LABELS: Record<TGardenType, string> = {
  raised_bed: 'Raised Bed',
  in_ground: 'In Ground',
  container: 'Container',
  greenhouse: 'Greenhouse',
  other: 'Other',
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-white',
    listContent: 'px-2 pt-3 pb-28',
    emptyWrap: 'flex-1 items-center justify-center py-20',
    emptyTitle: 'text-gray-600 font-semibold text-base',
    emptyText: 'text-gray-400 text-sm mt-2',
    errorBanner:
      'mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3',
    errorText: 'text-sm text-red-600',
    loadingWrap: 'flex-1 items-center justify-center py-20',
    typeRow: 'flex-row flex-wrap gap-2 mb-4',
    typeChip: 'px-3 py-1.5 rounded-full border border-gray-300 bg-white',
    typeChipActive: 'border-green-600 bg-green-50',
    typeChipText: 'text-xs text-gray-600 capitalize',
    typeChipTextActive: 'text-green-700 font-semibold',
    typeLabel: 'text-sm font-medium text-gray-700 mb-1',
    typeError: 'text-xs text-red-500 -mt-2 mb-3',
    dimLabel: 'text-sm font-medium text-gray-700 mb-1',
    dimRow: 'flex-row gap-3',
    dimField: 'flex-1',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const GardensScreen = () => {
  const router = useRouter()
  const {
    gardens,
    isLoading,
    error,
    createGarden,
    updateGarden,
    deleteGarden,
  } = useGardens()

  const s = styles()

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGarden, setEditingGarden] = useState<IGarden | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<TGardenType | ''>('')
  const [widthInches, setWidthInches] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // -------------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setName('')
    setType('')
    setWidthInches('')
    setHeightInches('')
    setFieldErrors({})
    setIsSubmitting(false)
    setEditingGarden(null)
  }, [])

  const openCreateModal = useCallback(() => {
    resetForm()
    setModalVisible(true)
  }, [resetForm])

  const openEditModal = useCallback((garden: IGarden) => {
    setEditingGarden(garden)
    setName(garden.name)
    setType(garden.type)
    setWidthInches(String(garden.dimensions.widthInches))
    setHeightInches(String(garden.dimensions.heightInches))
    setFieldErrors({})
    setIsSubmitting(false)
    setModalVisible(true)
  }, [])

  const handleClose = useCallback(() => {
    setModalVisible(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(async () => {
    const payload: Partial<ICreateGardenPayload> = {
      name: name.trim() || undefined,
      type: type || undefined,
      dimensions:
        widthInches || heightInches
          ? {
            widthInches: parseInt(widthInches, 10) || 0,
            heightInches: parseInt(heightInches, 10) || 0,
            lengthInches: parseInt(heightInches, 10) || 0,
          }
          : undefined,
    }

    const result = validateGarden(payload)

    if (!result.valid) {
      const errs: Record<string, string> = {}
      result.errors.forEach((e) => {
        errs[e.field] = e.message
      })
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      if (editingGarden) {
        await updateGarden(editingGarden.id, payload as ICreateGardenPayload)
      } else {
        await createGarden(payload as ICreateGardenPayload)
      }
      setModalVisible(false)
      resetForm()
    } catch {
      // Error is handled by the hook; keep modal open so user can retry
    } finally {
      setIsSubmitting(false)
    }
  }, [
    name,
    type,
    widthInches,
    heightInches,
    editingGarden,
    createGarden,
    updateGarden,
    resetForm,
  ])

  // -------------------------------------------------------------------------
  // List handlers
  // -------------------------------------------------------------------------

  const handleCardPress = useCallback(
    (gardenId: string) => {
      router.push(`/gardens/${gardenId}`)
    },
    [router]
  )

  const handleDelete = useCallback(
    async (gardenId: string) => {
      await deleteGarden(gardenId)
    },
    [deleteGarden]
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const renderGardenCard = useCallback(
    ({ item }: { item: IGarden }) => (
      <GardenCard
        garden={item}
        onPress={handleCardPress}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    ),
    [handleCardPress, openEditModal, handleDelete]
  )

  const renderEmptyState = () => (
    <View className={s.emptyWrap()}>
      <Text className={s.emptyTitle()}>No gardens yet</Text>
      <Text className={s.emptyText()}>Tap + to add your first garden</Text>
    </View>
  )

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
      ) : (
          <FlashList
            data={gardens}
            renderItem={renderGardenCard}
            contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 112 }}
            ListEmptyComponent={renderEmptyState}
            keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Fab
        iconName="plus"
        onPress={openCreateModal}
        accessibilityLabel="Add garden"
      />

      {/* Create / Edit garden modal */}
      <FormModal
        visible={modalVisible}
        title={editingGarden ? 'Edit Garden' : 'New Garden'}
        onClose={handleClose}
      >
        {/* Name */}
        <FormField
          label="Garden Name"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          required
          placeholder="e.g. Tomato Bed"
          maxLength={110}
          returnKeyType="next"
        />

        {/* Type */}
        <Text className={s.typeLabel()}>Garden Type *</Text>
        <View className={s.typeRow()}>
          {GARDEN_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`${s.typeChip()} ${type === t ? s.typeChipActive() : ''}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === t }}
              accessibilityLabel={GARDEN_TYPE_LABELS[t]}
            >
              <Text
                className={`${s.typeChipText()} ${type === t ? s.typeChipTextActive() : ''}`}
              >
                {GARDEN_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
        {fieldErrors.type ? (
          <Text className={s.typeError()}>{fieldErrors.type}</Text>
        ) : null}

        {/* Dimensions */}
        <Text className={s.dimLabel()}>Dimensions (inches) *</Text>
        <View className={s.dimRow()}>
          <View className={s.dimField()}>
            <FormField
              label="Width"
              value={widthInches}
              onChangeText={setWidthInches}
              error={fieldErrors['dimensions.widthInches']}
              placeholder="Width"
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>
          <View className={s.dimField()}>
            <FormField
              label="Height"
              value={heightInches}
              onChangeText={setHeightInches}
              error={fieldErrors['dimensions.heightInches']}
              placeholder="Height"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>

        {/* Submit */}
        <SubmitButton
          label={editingGarden ? 'Save Changes' : 'Create Garden'}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          className="mt-4"
        />
      </FormModal>
    </View>
  )
}

export default GardensScreen
