/**
 * Plants screen
 *
 * Lists all plants using FlashList and PlantCard, provides a FAB to open
 * a FormModal for creating/editing plants, and supports delete via PlantCard
 * actions. Inline validation errors from `validatePlant` are displayed in the form.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import { Fab } from '@/src/components/Fab'
import { FormField } from '@/src/components/FormField'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/src/components/Modal'
import { PlantCard } from '@/src/components/PlantCard'
import { SubmitButton } from '@/src/components/SubmitButton'
import { usePlants } from '@/src/hooks/usePlants'
import type { IPlant } from '@/src/types/TPlant'
import { validatePlant } from '@/src/utils/validation'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-white',
    listContent: 'px-4 pt-3 pb-28',
    cardWrapper: 'mb-3',
    emptyWrap: 'flex-1 items-center justify-center py-20',
    emptyTitle: 'text-gray-600 font-semibold text-base',
    emptyText: 'text-gray-400 text-sm mt-2',
    errorBanner: 'mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3',
    errorText: 'text-sm text-red-600',
    loadingWrap: 'flex-1 items-center justify-center py-20',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const PlantsScreen = () => {
  const router = useRouter()
  const { plants, isLoading, error, createPlant, updatePlant, deletePlant } = usePlants()
  const s = styles()

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlant, setEditingPlant] = useState<IPlant | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [variety, setVariety] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setName('')
    setSpecies('')
    setVariety('')
    setFieldErrors({})
    setIsSubmitting(false)
    setEditingPlant(null)
  }

  const openCreateModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (plant: IPlant) => {
    setEditingPlant(plant)
    setName(plant.name ?? '')
    setSpecies(plant.species ?? '')
    setVariety(plant.variety ?? '')
    setFieldErrors({})
    setIsSubmitting(false)
    setModalVisible(true)
  }

  const handleClose = () => {
    resetForm()
    setModalVisible(false)
  }

  const handleSubmit = async () => {
    const input = {
      name: name.trim() || undefined,
      species: species.trim() || undefined,
      variety: variety.trim() || undefined,
    }

    const result = validatePlant(input)

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
      if (editingPlant) {
        await updatePlant(editingPlant.id, {
          name: name.trim(),
          species: species.trim(),
          variety: variety.trim() || undefined,
        })
      } else {
        await createPlant({
          name: name.trim(),
          species: species.trim(),
          variety: variety.trim() || undefined,
        })
      }
      handleClose()
    } catch {
      // Error is handled by the hook; keep modal open so user can retry
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(
    (plantId: string) => {
      const plant = plants.find((p) => p.id === plantId)
      Alert.alert(
        'Delete Plant',
        `Are you sure you want to delete "${plant?.name ?? 'this plant'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void deletePlant(plantId),
          },
        ]
      )
    },
    [plants, deletePlant]
  )

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleViewPhotos = useCallback(
    (plantId: string) => {
      router.push(`/plants/${plantId}`)
    },
    [router]
  )

  // ---------------------------------------------------------------------------
  // List rendering
  // ---------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: IPlant }) => (
      <View className={s.cardWrapper()}>
        <PlantCard
          plant={item}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onViewPhotos={handleViewPhotos}
        />
      </View>
    ),
    [handleDelete, handleViewPhotos, s]
  )

  const renderEmpty = () => (
    <View className={s.emptyWrap()}>
      <Text className={s.emptyTitle()}>No plants yet</Text>
      <Text className={s.emptyText()}>Tap + to add your first plant</Text>
    </View>
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View className={s.container()}>
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
      ) : (
          <FlashList
            data={plants}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 112 }}
            ListEmptyComponent={renderEmpty}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
      )}

      {/* FAB */}
      <Fab
        iconName="plus"
        onPress={openCreateModal}
        accessibilityLabel="Add plant"
      />

      {/* Create / Edit plant modal */}
      <Modal visible={modalVisible} onClose={handleClose}>
        <ModalHeader
          title={editingPlant ? 'Edit Plant' : 'New Plant'}
          onClose={handleClose}
        />

        <ModalBody>
          <FormField
            label="Plant Name"
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
            required
            placeholder="e.g. Tomato"
            maxLength={110}
            returnKeyType="next"
          />

          <FormField
            label="Species"
            value={species}
            onChangeText={setSpecies}
            error={fieldErrors.species}
            required
            placeholder="e.g. Solanum lycopersicum"
            maxLength={110}
            returnKeyType="next"
          />

          <FormField
            label="Variety"
            value={variety}
            onChangeText={setVariety}
            error={fieldErrors.variety}
            placeholder="e.g. Cherry (optional)"
            maxLength={110}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </ModalBody>

        <ModalFooter>
          <SubmitButton
            label={editingPlant ? 'Save Changes' : 'Create Plant'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />
        </ModalFooter>
      </Modal>
    </View>
  )
}

export default PlantsScreen
