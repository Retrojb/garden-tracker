import type { IReusableInputProps } from '@/types/TInput';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { tv } from 'tailwind-variants';

import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const inputStyles = tv({
  slots: {
    wrapper: 'flex flex-col gap-1',
    label: 'text-sm font-medium text-gray-700',
    inputContainer: 'flex flex-row items-center',
    textInput:
      'flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white',
    errorMessage: 'text-xs text-red-500 mt-1',
  },
  variants: {
    mode: {
      text: {
        inputContainer: 'relative',
      },
      phone: {},
      password: {
        inputContainer: 'relative',
      },
    },
    hasError: {
      true: {
        textInput: 'border-red-400',
      },
    },
    isDisabled: {
      true: {
        wrapper: 'opacity-50',
        textInput: 'bg-gray-100 text-gray-500',
      },
    },
    isFocused: {
      true: {
        textInput: 'border-blue-500',
      },
    },
  },
  compoundVariants: [
    {
      hasError: true,
      isFocused: true,
      class: {
        textInput: 'border-red-400',
      },
    },
  ],
  defaultVariants: {
    mode: 'text',
    hasError: false,
    isDisabled: false,
    isFocused: false,
  },
});

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Manages the secureTextEntry state for password mode.
 * Toggles between visible and hidden password text.
 * Returns the logical negation of the input.
 */
const togglePasswordVisibility = (currentState: boolean): boolean => {
  return !currentState;
};

/**
 * Extracts only digit characters from a string.
 * Used to normalize phone input before passing to parent.
 */
const stripNonDigits = (input: string): string => {
  return input.replace(/[^\d]/g, '');
};

/**
 * Formats a raw digit string into US phone format: (XXX) XXX-XXXX
 * Only digits are retained from input. Formatting is progressive:
 *   1-3 digits  → (XXX
 *   4-6 digits  → (XXX) XXX
 *   7-10 digits → (XXX) XXX-XXXX
 *   >10 digits  → truncated to 10
 */
const formatPhoneNumber = (raw: string): string => {
  let digits = stripNonDigits(raw);

  if (digits.length > 10) {
    digits = digits.substring(0, 10);
  }

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
  }

  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ReusableInput — a unified, accessible text input supporting text, phone,
 * and password modes with NativeWind styling via tailwind-variants.
 */
const ReusableInput = ({
  mode,
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled,
  required,
  className,
  maxLength,
  accessibilityHint,
  autoCapitalize,
  showClearButton,
  onFocus,
  onBlur,
}: IReusableInputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);

  const hasError = typeof error === 'string' && error.trim().length > 0;
  const truncatedError = hasError ? error.slice(0, 200) : undefined;
  const errorId = hasError ? `${label}-error` : undefined;

  const styles = inputStyles({
    mode,
    hasError,
    isDisabled: !!disabled,
    isFocused,
  });

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChangeText = (text: string) => {
    if (mode === 'phone') {
      let digits = stripNonDigits(text);
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      onChangeText(digits);
    } else {
      onChangeText(text);
    }
  };

  const handleClear = () => {
    onChangeText('');
  };

  const handleTogglePassword = () => {
    setSecureTextEntry((prev) => togglePasswordVisibility(prev));
  };

  const displayValue = mode === 'phone' ? formatPhoneNumber(value ?? '') : (value ?? '');

  const keyboardType =
    mode === 'phone' ? 'phone-pad' : 'default';

  const visualLabel = required ? `${label} *` : label;

  return (
    <View className={cn(styles.wrapper(), className)}>
      <Text className={styles.label()}>{visualLabel}</Text>

      <View className={styles.inputContainer()}>
        <TextInput
          className={styles.textInput()}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          editable={!disabled}
          maxLength={mode === 'phone' ? 14 : maxLength}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={mode === 'password' ? secureTextEntry : false}
          autoComplete={mode === 'password' ? 'password' : undefined}
          textContentType={mode === 'password' ? 'password' : undefined}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={disabled ? { disabled: true } : undefined}
          aria-required={required === true ? true : undefined}
          aria-describedby={errorId}
          onFocus={disabled ? undefined : handleFocus}
          onBlur={disabled ? undefined : handleBlur}
        />

        {mode === 'text' && showClearButton && (value ?? '').length > 0 && !disabled && (
          <Pressable
            onPress={handleClear}
            className="absolute right-3 items-center justify-center"
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}

        {mode === 'password' && !disabled && (
          <Pressable
            onPress={handleTogglePassword}
            className="absolute right-3 items-center justify-center"
            accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#6b7280"
            />
          </Pressable>
        )}
      </View>

      {hasError && (
        <Text
          nativeID={errorId}
          className={styles.errorMessage()}
          accessibilityLiveRegion="polite"
        >
          {truncatedError}
        </Text>
      )}
    </View>
  );
};

export { formatPhoneNumber, ReusableInput, stripNonDigits, togglePasswordVisibility };
