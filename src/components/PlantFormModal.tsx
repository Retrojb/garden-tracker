/**
 * PlantFormModal
 *
 * A form modal for creating a new plant. Uses the generic Modal shell with
 * ModalHeader, ModalBody, and ModalFooter plus shared FormField and
 * SubmitButton components. Validates inline via `validatePlant` before
 * calling `onSubmit`.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import type { ICreatePlantPayload } from '@/src/types/TPayload'
import { validatePlant } from '@/src/utils/validation'
import React, { useState } from 'react'
import { FormField } from './FormField'
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal'
import { SubmitButton } from './SubmitButton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IPlantFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: ICreatePlantPayload) => Promise<void>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PlantFormModal = ({
  visible,
  onClose,
  onSubmit,
}: IPlantFormModalProps) => {
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [variety, setVariety] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setSpecies('')
    setVariety('')
    setFieldErrors({})
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
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
      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        variety: variety.trim() || undefined,
      })
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
      <ModalHeader title="New Plant" onClose={handleClose} />

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
          label="Create Plant"
          onPress={handleSubmit}
          isLoading={isSubmitting}
        />
      </ModalFooter>
    </Modal>
  )
}

export { PlantFormModal }
export type { IPlantFormModalProps }

