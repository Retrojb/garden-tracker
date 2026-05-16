type InputMode = 'text' | 'phone' | 'password'

type IReusableInputProps = {
  /** Input mode determines behavior and keyboard type */
  mode: InputMode
  /** Label displayed above the input */
  label: string
  /** Current input value (raw, unformatted for phone mode) */
  value: string | undefined | null
  /** Change handler — receives raw value (digits only for phone) */
  onChangeText: (text: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Error message — when present, shows error styling and message */
  error?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the field is required (appends * to label) */
  required?: boolean
  /** Additional className for the outermost wrapper */
  className?: string
  /** Maximum character length */
  maxLength?: number
  /** Accessibility hint for screen readers */
  accessibilityHint?: string
  /** Auto-capitalize behavior */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  /** Whether to show the clear button (text mode only) */
  showClearButton?: boolean
  /** Called when input receives focus */
  onFocus?: () => void
  /** Called when input loses focus */
  onBlur?: () => void
}

export type { IReusableInputProps, InputMode }

