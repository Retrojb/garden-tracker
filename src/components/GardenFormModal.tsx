/**
 * GardenFormModal
 *
 * A form modal for creating a new garden. Uses the generic Modal shell with
 * ModalHeader, ModalBody, and ModalFooter plus shared FormField and
 * SubmitButton components. Renders fields for name, type, width, and height.
 * Validates inline before calling `onSubmit`.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { TGardenType } from '@/src/types/TGarden'
import type { ICreateGardenPayload } from '@/src/types/TPayload'
import { validateGarden } from '@/src/utils/validation'
import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'
import { FormField } from './FormField'
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal'
import { SubmitButton } from './SubmitButton'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    errorText: 'text-xs text-red-500 mb-3',
    row: 'flex-row gap-3',
    halfField: 'flex-1',
    typeRow: 'flex-row flex-wrap gap-2 mb-4',
    typeChip: 'px-3 py-1.5 rounded-full border border-gray-300 bg-white',
    typeChipActive: 'border-green-600 bg-green-50',
    typeChipText: 'text-xs text-gray-600 capitalize',
    typeChipTextActive: 'text-green-700 font-semibold',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IGardenFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: ICreateGardenPayload) => Promise<void>
}

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
// Component
// ---------------------------------------------------------------------------

const GardenFormModal = ({
  visible,
  onClose,
  onSubmit,
}: IGardenFormModalProps) => {
  const s = styles()

  const [name, setName] = useState('')
  const [type, setType] = useState<TGardenType | ''>('')
  const [widthInches, setWidthInches] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [lengthInches, setLengthInches] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setType('')
    setWidthInches('')
    setHeightInches('')
    setFieldErrors({})
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    const payload: Partial<ICreateGardenPayload> = {
      name: name.trim() || undefined,
      type: type || undefined,
      dimensions:
        widthInches || heightInches || lengthInches
          ? {
              widthInches: parseInt(widthInches, 10),
              heightInches: parseInt(heightInches, 10),
            lengthInches: parseInt(lengthInches, 10),
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
      await onSubmit(payload as ICreateGardenPayload)
      resetForm()
      onClose()
    } catch {
      // Error is handled by the hook; keep modal open so user can retry
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} onClose={handleClose}>
      <ModalHeader title="New Garden" onClose={handleClose} />

      <ModalBody>
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
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Garden Type *
        </Text>
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
          <Text className={`${s.errorText()} -mt-2`}>
            {fieldErrors.type}
          </Text>
        ) : null}

        {/* Dimensions */}
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Dimensions (inches) *
        </Text>
        <View className={s.row()}>
          <View className={s.halfField()}>
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

          <View className={s.halfField()}>
            <FormField
              label="Height"
              value={heightInches}
              onChangeText={setHeightInches}
              error={fieldErrors['dimensions.heightInches']}
              placeholder="Height"
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>

          <View className={s.halfField()}>
            <FormField
              label="Length"
              value={lengthInches}
              onChangeText={setLengthInches}
              error={fieldErrors['dimensions.lengthInches']}
              placeholder="Length"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>
      </ModalBody>

      <ModalFooter>
        <SubmitButton
          label="Create Garden"
          onPress={handleSubmit}
          isLoading={isSubmitting}
        />
      </ModalFooter>
    </Modal>
  )
}

export { GardenFormModal }
export type { IGardenFormModalProps }

