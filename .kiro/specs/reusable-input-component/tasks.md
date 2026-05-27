# Implementation Plan: Reusable Input Component

## Overview

Implement a unified, accessible `ReusableInput` component for the Garden Tracker app supporting three modes (text, phone, password) with NativeWind styling via `tailwind-variants`, full accessibility, and cross-platform consistency. The component lives at `src/components/ReusableInput.tsx` with types at `src/types/TInput.ts`.

## Tasks

- [x] 1. Define types and utility functions
  - [x] 1.1 Create type definitions at `src/types/TInput.ts`
    - Define `InputMode` type as `'text' | 'phone' | 'password'`
    - Define `IReusableInputProps` interface with all props from the design
    - Use named exports
    - _Requirements: 9.1, 9.2, 1.1, 2.1, 3.1_

  - [x] 1.2 Implement `formatPhoneNumber` and `stripNonDigits` utilities in `src/components/ReusableInput.tsx`
    - Implement `stripNonDigits` to extract only digit characters from a string
    - Implement `formatPhoneNumber` with progressive formatting: 1-3 digits → `(XXX`, 4-6 → `(XXX) XXX`, 7-10 → `(XXX) XXX-XXXX`
    - Truncate to 10 digits if input exceeds limit
    - Return empty string for empty input
    - Export both utilities as named exports for testability
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 2.2, 2.3_

  - [x] 1.3 Write property tests for phone formatting (Property 1: Round-Trip Stability)
    - **Property 1: Phone Format Round-Trip Stability**
    - For any digit string `d` where `d.length <= 10`, `stripNonDigits(formatPhoneNumber(d)) === d`
    - Use `fast-check` with `fc.stringOf(fc.constantFrom(...'0123456789'), {minLength: 1, maxLength: 10})`
    - **Validates: Requirements 10.1, 2.2**

  - [x] 1.4 Write property tests for phone formatting (Property 2: Output Validity)
    - **Property 2: Phone Format Output Validity**
    - For any input string, `formatPhoneNumber(s).length <= 14` and output contains only `[0-9() -]`
    - Use `fast-check` with `fc.string()` as arbitrary input
    - **Validates: Requirements 10.2, 10.3**

  - [ ]* 1.5 Write property tests for phone mode change handler (Property 3: Emits Only Digits)
    - **Property 3: Phone Mode Emits Only Digits**
    - For any input text processed through the phone mode change handler, the emitted value matches `/^\d{0,10}$/`
    - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 2. Implement core ReusableInput component
  - [x] 2.1 Create component file at `src/components/ReusableInput.tsx` with styling variants
    - Set up `tailwind-variants` with variants for: mode, error state, disabled state, focused state
    - Define base styles for wrapper, label, input container, text input, and error message
    - Implement `cn()` utility usage for className merge (tailwind-merge) on outermost wrapper
    - Use NativeWind className prop — no inline `style` objects for appearance
    - _Requirements: 8.2, 8.3_

  - [x] 2.2 Implement label rendering with required indicator
    - Render `label` prop as visible text above the input
    - Append asterisk (*) to visual label when `required` is true
    - Keep `accessibilityLabel` as clean label text without asterisk
    - Set `aria-required` to true on TextInput when `required` is true
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Implement text mode behavior
    - Set `keyboardType` to "default" when mode is "text"
    - Forward unmodified text to `onChangeText` callback
    - Display exact `value` prop without transformation
    - Implement clear button logic when `showClearButton` is enabled (invoke `onChangeText('')` on press, hide when value is empty)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.4 Implement phone mode behavior
    - Set `keyboardType` to "phone-pad"
    - Use `formatPhoneNumber(value)` for display value
    - In change handler: strip non-digits, truncate to 10, pass raw digits to `onChangeText`
    - Set `maxLength` to 14 on TextInput (formatted length)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.5 Implement password mode behavior with toggle
    - Set initial `secureTextEntry` to true via `useState`
    - Render eye icon toggle button (Pressable + @expo/vector-icons) at trailing end
    - Toggle `secureTextEntry` on press
    - Set `autoComplete="password"` and `textContentType="password"`
    - Forward unmodified text to `onChangeText`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.6 Write property test for password toggle (Property 4: Toggle Idempotency)
    - **Property 4: Password Toggle Idempotency**
    - For any boolean state `s`, applying toggle twice returns original: `toggle(toggle(s)) === s`
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 2.7 Write property test for mode props resolution (Property 5: Mode Props Consistency)
    - **Property 5: Mode Props Consistency**
    - For any valid `InputMode` and `isPasswordVisible` boolean, `secureTextEntry === true` iff `mode === 'password'` AND `isPasswordVisible === false`
    - **Validates: Requirements 3.1, 3.5, 1.1, 2.1**

- [~] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement error display and disabled state
  - [x] 4.1 Implement error display
    - Show error message below input when `error` is non-empty, non-whitespace string
    - Truncate error message to 200 characters
    - Apply error border styling distinct from default and focused styles
    - Hide error message and styling when `error` is undefined, empty, or whitespace-only
    - Set `accessibilityLiveRegion="polite"` on error text element
    - Associate error text with input via `accessibilityDescribedBy` or equivalent
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.2 Implement disabled state
    - Set `editable={false}` when `disabled` is true
    - Apply `opacity-50` to outermost wrapper
    - Prevent focus, keyboard, and auxiliary control interaction
    - Set `accessibilityState={{ disabled: true }}` on TextInput
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 4.3 Write property test for disabled state (Property 6: Disabled State Rendering)
    - **Property 6: Disabled State Rendering**
    - For any valid props where `disabled === true`, component renders with `editable={false}` and reduced opacity
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 4.4 Write property test for error display (Property 7: Error Display Consistency)
    - **Property 7: Error Display Consistency**
    - For any props with non-empty `error`, error message is rendered and error styling applied; for undefined/empty `error`, neither is rendered
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 5. Implement accessibility and controlled component contract
  - [x] 5.1 Implement full accessibility support
    - Set `accessibilityLabel` on TextInput to `label` prop value
    - Pass `accessibilityHint` when provided
    - Set `accessibilityLabel` on password toggle: "Show password" / "Hide password"
    - Set `accessibilityRole="button"` on password toggle
    - Set `accessibilityState={{ disabled: true }}` when disabled
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.2 Ensure controlled component contract
    - Always display value derived from `value` prop (formatted for phone, direct for others)
    - Never maintain internal text state diverging from `value` prop
    - Display empty string when `value` is undefined or null
    - Invoke `onChangeText` on user input without updating display independently
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 5.3 Write property test for label accessibility (Property 8: Label Accessibility)
    - **Property 8: Label Accessibility**
    - For any rendered ReusableInput, TextInput has `accessibilityLabel` equal to `label` prop; when `required` is true, visual label has asterisk but `accessibilityLabel` does not
    - **Validates: Requirements 4.1, 4.2, 4.3, 7.1**

  - [ ]* 5.4 Write property test for controlled display (Property 9: Controlled Component Display)
    - **Property 9: Controlled Component Display**
    - For non-phone modes, displayed text equals `value` prop; for phone mode, displayed text equals `formatPhoneNumber(value)`
    - **Validates: Requirements 9.1, 9.3, 1.2, 1.3, 2.6**

  - [ ]* 5.5 Write property test for className merge (Property 10: ClassName Merge)
    - **Property 10: ClassName Merge**
    - For any `className` string provided, outermost wrapper includes both default and consumer-provided classes
    - **Validates: Requirements 8.3**

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration and wiring
  - [x] 7.1 Wire component exports and verify cross-platform consistency
    - Ensure named export from `src/components/ReusableInput.tsx`
    - Verify component uses no `Platform.OS` checks or platform-specific props
    - Verify no inline `style` prop objects for appearance
    - Confirm `onFocus` and `onBlur` callbacks are forwarded to TextInput
    - _Requirements: 8.1, 8.2, 8.3, 9.1_

  - [x] 7.2 Write unit tests for ReusableInput component
    - Test text mode renders with correct keyboard type and passes through value
    - Test phone mode displays formatted value and emits raw digits
    - Test password mode renders with secureTextEntry and toggle works
    - Test label renders with asterisk when required
    - Test error message displays and hides correctly
    - Test disabled state applies opacity and prevents editing
    - Test clear button shows/hides and invokes onChangeText with empty string
    - Test accessibility props are set correctly
    - _Requirements: 1.1–1.5, 2.1–2.6, 3.1–3.6, 4.1–4.4, 5.1–5.5, 6.1–6.4, 7.1–7.6_

- [~] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- DO NOT execute unit tests (workspace rule) — tests are written but not run as part of this workflow
- Component file: `src/components/ReusableInput.tsx`
- Types file: `src/types/TInput.ts`
- Test library: `jest` + `@testing-library/react-native`
- Property test library: `fast-check`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["2.6", "2.7", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4", "5.5", "7.1"] },
    { "id": 6, "tasks": ["7.2"] }
  ]
}
```
