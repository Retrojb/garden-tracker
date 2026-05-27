import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import type { IPhoto } from '@/src/types/TPhoto'
import type { IPlant } from '@/src/types/TPlant'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IPlantCardProps {
  plant: IPlant
  /** Most recent photo for this plant, if available */
  recentPhoto?: IPhoto | null
  onEdit: (plant: IPlant) => void
  onDelete: (plantId: string) => void
  onViewPhotos: (plantId: string) => void
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const plantCardStyle = tv({
  slots: {
    container:
      'flex-row items-center rounded-2xl bg-mauve-300 border border-indigo-200 p-3 shadow-sm',
    thumbnail: 'w-14 h-14 rounded-lg bg-gray-200',
    thumbnailPlaceholder:
      'w-14 h-14 rounded-lg bg-gray-200 items-center justify-center',
    placeholderIcon: 'text-gray-400 text-xl',
    infoContainer: 'flex-1 ml-3',
    name: 'text-base font-semibold text-gray-900',
    species: 'text-sm text-gray-600 mt-0.5',
    variety: 'text-xs text-gray-400 mt-0.5',
    actionsContainer: 'flex-row items-center gap-2',
    actionButton: 'p-2 rounded-lg',
    editButton: 'bg-indigo-100',
    deleteButton: 'bg-red-100',
    actionText: 'text-xs font-medium',
    editText: 'text-indigo-700',
    deleteText: 'text-red-700',
  },
})

const {
  container,
  thumbnail,
  thumbnailPlaceholder,
  placeholderIcon,
  infoContainer,
  name,
  species,
  variety,
  actionsContainer,
  actionButton,
  editButton,
  deleteButton,
  actionText,
  editText,
  deleteText,
} = plantCardStyle()

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PlantCard displays a summary of a single plant record with quick-action buttons.
 *
 * Responsibilities:
 * - Render plant name, species, variety
 * - Show thumbnail of most recent photo if available
 * - Provide edit and delete affordances
 *
 * Requirements: 1.9, 5.9
 */
const PlantCard = ({
  plant,
  recentPhoto,
  onEdit,
  onDelete,
  onViewPhotos,
}: IPlantCardProps) => {
  const handleEdit = () => onEdit(plant)
  const handleDelete = () => onDelete(plant.id)
  const handleViewPhotos = () => onViewPhotos(plant.id)

  return (
    <View className={container()} accessibilityRole="summary">
      {/* Thumbnail */}
      <Pressable onPress={handleViewPhotos} accessibilityLabel="View photos">
        {recentPhoto ? (
          <Image
            source={{ uri: recentPhoto.localUri }}
            className={thumbnail()}
            accessibilityLabel={`Photo of ${plant.name ?? 'plant'}`}
            resizeMode="cover"
          />
        ) : (
          <View className={thumbnailPlaceholder()}>
            <Text className={placeholderIcon()}>🌱</Text>
          </View>
        )}
      </Pressable>

      {/* Plant info */}
      <View className={infoContainer()}>
        {plant.name ? (
          <Text className={name()} numberOfLines={1}>
            {plant.name}
          </Text>
        ) : null}
        {plant.species ? (
          <Text className={species()} numberOfLines={1}>
            {plant.species}
          </Text>
        ) : null}
        {plant.variety ? (
          <Text className={variety()} numberOfLines={1}>
            {plant.variety}
          </Text>
        ) : null}
      </View>

      {/* Action buttons */}
      <View className={actionsContainer()}>
        <Pressable
          onPress={handleEdit}
          className={`${actionButton()} ${editButton()}`}
          accessibilityLabel="Edit plant"
          accessibilityRole="button"
        >
          <Text className={`${actionText()} ${editText()}`}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          className={`${actionButton()} ${deleteButton()}`}
          accessibilityLabel="Delete plant"
          accessibilityRole="button"
        >
          <Text className={`${actionText()} ${deleteText()}`}>Delete</Text>
        </Pressable>
      </View>
    </View>
  )
}

export { PlantCard }
export type { IPlantCardProps }

