/**
 * SubmitButton
 *
 * A reusable submit button with loading state. Used across form modals
 * to maintain consistent styling and behavior.
 */

import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    base: 'rounded-2xl bg-green-600 py-3.5 items-center justify-center',
    disabled: 'bg-green-300',
    text: 'text-white font-semibold text-base',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ISubmitButtonProps {
  /** Button label text */
  label: string
  /** Press handler */
  onPress: () => void
  /** Whether the button is in a loading/submitting state */
  isLoading?: boolean
  /** Accessibility label override */
  accessibilityLabel?: string
  /** Additional className */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SubmitButton = ({
  label,
  onPress,
  isLoading = false,
  accessibilityLabel,
  className,
}: ISubmitButtonProps) => {
  const s = styles()

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={`${s.base()} ${isLoading ? s.disabled() : ''} ${className ?? ''}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={s.text()}>{label}</Text>
      )}
    </Pressable>
  )
}

export { SubmitButton }
export type { ISubmitButtonProps }

