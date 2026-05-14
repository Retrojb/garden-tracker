/**
 * GardenFormModal
 *
 * A form modal for creating a new garden. Uses the generic Modal shell with
 * ModalHeader, ModalBody, and ModalFooter. Renders fields for name, type,
 * width, and height. Validates inline before calling `onSubmit`.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { TGardenType } from '@/src/types/TGarden'
import type { ICreateGardenPayload } from '@/src/types/TPayload'
import { validateGarden } from '@/src/utils/validation'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { tv } from 'tailwind-variants'
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    label: 'text-sm font-medium text-gray-700 mb-1',
    input:
      'border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white mb-1',
    inputError: 'border-red-400',
    errorText: 'text-xs text-red-500 mb-3',
    row: 'flex-row gap-3',
    halfField: 'flex-1',
    typeRow: 'flex-row flex-wrap gap-2 mb-4',
    typeChip: 'px-3 py-1.5 rounded-full border border-gray-300 bg-white',
    typeChipActive: 'border-green-600 bg-green-50',
    typeChipText: 'text-xs text-gray-600 capitalize',
    typeChipTextActive: 'text-green-700 font-semibold',
    submitBtn: 'rounded-2xl bg-green-600 py-3.5 items-center justify-center',
    submitBtnDisabled: 'bg-green-300',
    submitBtnText: 'text-white font-semibold text-base',
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
        widthInches || heightInches
          ? {
              widthInches: parseInt(widthInches, 10),
              heightInches: parseInt(heightInches, 10),
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
        <Text className={s.label()}>Garden Name *</Text>
        <TextInput
          className={`${s.input()} ${fieldErrors.name ? s.inputError() : ''}`}
          placeholder="e.g. Tomato Bed"
          value={name}
          onChangeText={setName}
          maxLength={110}
          returnKeyType="next"
          accessibilityLabel="Garden name"
        />
        {fieldErrors.name ? (
          <Text className={s.errorText()}>{fieldErrors.name}</Text>
        ) : null}

        {/* Type */}
        <Text className={s.label()}>Garden Type *</Text>
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
        <Text className={s.label()}>Dimensions (inches) *</Text>
        <View className={s.row()}>
          <View className={s.halfField()}>
            <TextInput
              className={`${s.input()} ${fieldErrors['dimensions.widthInches'] ? s.inputError() : ''}`}
              placeholder="Width"
              value={widthInches}
              onChangeText={setWidthInches}
              keyboardType="number-pad"
              returnKeyType="next"
              accessibilityLabel="Width in inches"
            />
            {fieldErrors['dimensions.widthInches'] ? (
              <Text className={s.errorText()}>
                {fieldErrors['dimensions.widthInches']}
              </Text>
            ) : null}
          </View>

          <View className={s.halfField()}>
            <TextInput
              className={`${s.input()} ${fieldErrors['dimensions.heightInches'] ? s.inputError() : ''}`}
              placeholder="Height"
              value={heightInches}
              onChangeText={setHeightInches}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Height in inches"
            />
            {fieldErrors['dimensions.heightInches'] ? (
              <Text className={s.errorText()}>
                {fieldErrors['dimensions.heightInches']}
              </Text>
            ) : null}
          </View>
        </View>
      </ModalBody>

      <ModalFooter>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`${s.submitBtn()} ${isSubmitting ? s.submitBtnDisabled() : ''}`}
          accessibilityRole="button"
          accessibilityLabel="Create garden"
          accessibilityState={{ disabled: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={s.submitBtnText()}>Create Garden</Text>
          )}
        </Pressable>
      </ModalFooter>
    </Modal>
  )
}

export { GardenFormModal }
export type { IGardenFormModalProps }

