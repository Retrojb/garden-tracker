/**
 * FormField
 *
 * A reusable form field component that renders a label, text input, and
 * optional inline error message. Used across form modals (Garden, Plant, etc.)
 * to maintain consistent styling and accessibility.
 */

import React from 'react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    wrapper: 'mb-1',
    label: 'text-sm font-medium text-gray-700 mb-1',
    input:
      'border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white',
    inputError: 'border-red-400',
    errorText: 'text-xs text-red-500 mt-1 mb-2',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IFormFieldProps extends Omit<TextInputProps, 'className'> {
  /** Field label displayed above the input */
  label: string
  /** Current field value */
  value: string
  /** Change handler */
  onChangeText: (text: string) => void
  /** Optional error message — when present, input shows error styling */
  error?: string
  /** Whether the field is required (appends * to label) */
  required?: boolean
  /** Additional className for the wrapper */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormField = ({
  label,
  value,
  onChangeText,
  error,
  required,
  className,
  ...inputProps
}: IFormFieldProps) => {
  const s = styles()

  return (
    <View className={`${s.wrapper()} ${className ?? ''}`}>
      <Text className={s.label()}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        className={`${s.input()} ${error ? s.inputError() : ''}`}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        {...inputProps}
      />
      {error ? <Text className={s.errorText()}>{error}</Text> : null}
    </View>
  )
}

export { FormField }
export type { IFormFieldProps }

