/**
 * GardenCard
 *
 * Displays a summary card for a garden record showing name, type, and size.
 * Navigates to garden detail on press. Provides edit and delete action buttons.
 *
 * Requirements: 2.1
 */

import type { IGarden, TGardenType } from '@/src/types/TGarden'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const gardenCardStyles = tv({
  slots: {
    base: 'rounded-2xl bg-mauve-300 border-4 border-indigo-200 shadow-md p-4 m-2',
    header: 'flex-row items-center justify-between',
    name: 'text-base font-semibold text-gray-900 flex-1',
    typePill: 'rounded-full px-2.5 py-1 bg-green-600',
    typeLabel: 'text-xs font-medium text-white capitalize',
    sizeText: 'text-sm text-gray-500 mt-1',
    actions: 'flex-row gap-3 mt-3 pt-3 border-t border-gray-200',
    actionButton: 'px-3 py-1.5 rounded-lg',
    editButton: 'bg-indigo-100',
    deleteButton: 'bg-red-100',
    editButtonText: 'text-xs font-medium text-indigo-700',
    deleteButtonText: 'text-xs font-medium text-red-700',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IGardenCardProps {
  garden: IGarden
  onPress: (gardenId: string) => void
  onEdit: (garden: IGarden) => void
  onDelete: (gardenId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GARDEN_TYPE_LABELS: Record<TGardenType, string> = {
  raised_bed: 'Raised Bed',
  in_ground: 'In Ground',
  container: 'Container',
  greenhouse: 'Greenhouse',
  other: 'Other',
}

const formatGardenType = (type: TGardenType): string =>
  GARDEN_TYPE_LABELS[type] ?? type

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GardenCard = ({ garden, onPress, onEdit, onDelete }: IGardenCardProps) => {
  const s = gardenCardStyles()

  return (
    <Pressable
      onPress={() => onPress(garden.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={`View garden ${garden.name}`}
    >
      <View className={s.base()}>
        {/* Header: name + type pill */}
        <View className={s.header()}>
          <Text className={s.name()} numberOfLines={1}>
            {garden.name}
          </Text>
          <View className={s.typePill()}>
            <Text className={s.typeLabel()}>
              {formatGardenType(garden.type)}
            </Text>
          </View>
        </View>

        {/* Size */}
        <Text className={s.sizeText()}>{garden.size}</Text>

        {/* Actions */}
        <View className={s.actions()}>
          <Pressable
            onPress={() => onEdit(garden)}
            className={`${s.actionButton()} ${s.editButton()}`}
            accessibilityRole="button"
            accessibilityLabel={`Edit garden ${garden.name}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className={s.editButtonText()}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(garden.id)}
            className={`${s.actionButton()} ${s.deleteButton()}`}
            accessibilityRole="button"
            accessibilityLabel={`Delete garden ${garden.name}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className={s.deleteButtonText()}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

export { GardenCard }
export type { IGardenCardProps }

