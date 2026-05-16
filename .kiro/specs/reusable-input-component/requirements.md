# Requirements Document

## Introduction

This document defines the requirements for the Reusable Input Component in the Garden Tracker app. The component provides a unified, accessible text input supporting three modes — plain text, phone (with formatting/masking), and password (with show/hide toggle) — built with React Native, Expo, and NativeWind for cross-platform use on iOS, Android, and Web.

## Glossary

- **ReusableInput**: The React Native component that renders a configurable text input with label, error display, and mode-specific behavior
- **InputMode**: A union type (`'text' | 'phone' | 'password'`) that determines the input behavior and keyboard configuration
- **Phone_Mask_Logic**: The formatting algorithm that converts raw digit strings into US phone format `(XXX) XXX-XXXX`
- **Password_Toggle**: A pressable icon button that toggles password text visibility between hidden (dots) and plain text
- **Controlled_Component**: A React pattern where the displayed value is always derived from props, never from internal state

## Requirements

### Requirement 1: Text Input Mode

**User Story:** As a user, I want to enter plain text into form fields, so that I can provide information like garden names and descriptions.

#### Acceptance Criteria

1. WHEN mode is set to "text", THE ReusableInput SHALL render a TextInput with `keyboardType` set to "default"
2. WHEN a user types characters in text mode, THE ReusableInput SHALL forward the unmodified text to the `onChangeText` callback
3. WHEN the `value` prop changes in text mode, THE ReusableInput SHALL display the exact value provided without transformation
4. WHERE `showClearButton` is enabled in text mode, WHEN the user presses the clear button, THE ReusableInput SHALL invoke the `onChangeText` callback with an empty string
5. WHERE `showClearButton` is enabled in text mode, IF the `value` prop is an empty string, THEN THE ReusableInput SHALL hide the clear button

---

### Requirement 2: Phone Input Mode

**User Story:** As a user, I want to enter phone numbers with automatic formatting, so that I can input phone numbers naturally while seeing them in a readable format.

#### Acceptance Criteria

1. WHEN mode is set to "phone", THE ReusableInput SHALL render a TextInput with `keyboardType` set to "phone-pad"
2. WHEN a user types digits in phone mode, THE Phone_Mask_Logic SHALL format the display value as `(XXX) XXX-XXXX` progressively based on digit count
3. WHEN a user types or pastes non-digit characters in phone mode, THE ReusableInput SHALL strip all non-digit characters before processing
4. WHEN the digit count exceeds 10 in phone mode, THE ReusableInput SHALL truncate the value to the first 10 digits
5. WHEN the `onChangeText` callback is invoked in phone mode, THE ReusableInput SHALL pass only raw digits (maximum 10) to the parent
6. WHEN the `value` prop is provided in phone mode, THE ReusableInput SHALL display `formatPhoneNumber(value)` rather than the raw value

---

### Requirement 3: Password Input Mode

**User Story:** As a user, I want to enter passwords securely with the option to reveal the text, so that I can verify what I typed without compromising security by default.

#### Acceptance Criteria

1. WHEN mode is set to "password", THE ReusableInput SHALL render a TextInput with `secureTextEntry` set to true as the initial visibility state
2. WHEN a user presses the Password_Toggle while `secureTextEntry` is true, THE ReusableInput SHALL set `secureTextEntry` to false and display the password as plain text
3. WHEN a user presses the Password_Toggle while `secureTextEntry` is false, THE ReusableInput SHALL set `secureTextEntry` back to true and hide the password
4. WHEN mode is set to "password", THE ReusableInput SHALL display an eye icon button to the trailing end of the input field
5. WHEN mode is set to "password", THE ReusableInput SHALL set `autoComplete` to "password" and `textContentType` to "password" for OS credential integration
6. WHEN a user types characters in password mode, THE ReusableInput SHALL forward the unmodified text to the `onChangeText` callback

---

### Requirement 4: Label and Required Indicator

**User Story:** As a user, I want to see clear labels on input fields with required indicators, so that I know what information is expected and which fields are mandatory.

#### Acceptance Criteria

1. THE ReusableInput SHALL render the `label` prop as visible text above the input field
2. WHERE `required` is set to true, THE ReusableInput SHALL append an asterisk (*) to the visible label text
3. WHERE `required` is set to true, THE ReusableInput SHALL keep the `accessibilityLabel` as the clean label text without the asterisk and SHALL set `aria-required` to true on the TextInput
4. WHERE `required` is not set or is set to false, THE ReusableInput SHALL render the label text without an asterisk and SHALL not set `aria-required` on the TextInput

---

### Requirement 5: Error Display

**User Story:** As a user, I want to see validation errors clearly associated with the input field, so that I can understand and correct my mistakes.

#### Acceptance Criteria

1. WHEN the `error` prop contains a non-empty, non-whitespace string, THE ReusableInput SHALL display the error message text below the input field, limited to a maximum of 200 characters with any excess truncated
2. WHEN the `error` prop contains a non-empty, non-whitespace string, THE ReusableInput SHALL apply a visually distinct border style to the input field that differs from the default and focused border styles
3. WHEN the `error` prop is undefined, an empty string, or a whitespace-only string, THE ReusableInput SHALL render without error message text and without error border styling
4. WHEN the `error` prop changes from a non-error state (undefined, empty, or whitespace-only) to a non-empty string, or changes from one non-empty error string to a different non-empty error string, THE ReusableInput SHALL announce the error to screen readers via `accessibilityLiveRegion` set to "polite"
5. WHEN the error message is displayed, THE ReusableInput SHALL associate the error text with the input field using `accessibilityDescribedBy` or equivalent platform accessibility linking so that screen readers identify the error as belonging to the input

---

### Requirement 6: Disabled State

**User Story:** As a user, I want disabled inputs to be visually distinct and non-interactive, so that I understand which fields cannot be edited.

#### Acceptance Criteria

1. WHEN `disabled` is set to true, THE ReusableInput SHALL render the TextInput with `editable` set to false
2. WHEN `disabled` is set to true, THE ReusableInput SHALL apply an opacity of 0.5 to the outermost wrapper to indicate the non-interactive state
3. WHEN `disabled` is set to true, THE ReusableInput SHALL prevent focus events, keyboard display, and interaction with auxiliary controls (Password_Toggle and clear button) regardless of user interaction
4. WHEN `disabled` is set to true, THE ReusableInput SHALL set `accessibilityState` to `{ disabled: true }` on the TextInput so that screen readers announce the field as disabled

---

### Requirement 7: Accessibility

**User Story:** As a user relying on assistive technology, I want the input component to be fully accessible, so that I can interact with forms using a screen reader.

#### Acceptance Criteria

1. THE ReusableInput SHALL set `accessibilityLabel` on the TextInput to the value of the `label` prop
2. WHERE `accessibilityHint` is provided, THE ReusableInput SHALL set it on the TextInput for additional screen reader context
3. WHEN the Password_Toggle is rendered and `secureTextEntry` is true, THE ReusableInput SHALL provide an `accessibilityLabel` of "Show password" on the toggle, and WHEN `secureTextEntry` is false, THE ReusableInput SHALL provide an `accessibilityLabel` of "Hide password"
4. WHEN an error is displayed, THE ReusableInput SHALL set `accessibilityLiveRegion` to "polite" on the error text element to announce the error without requiring focus change
5. WHEN the Password_Toggle is rendered, THE ReusableInput SHALL set `accessibilityRole` to "button" on the toggle element
6. WHEN `disabled` is set to true, THE ReusableInput SHALL set `accessibilityState` with `disabled: true` on the TextInput so assistive technology communicates the non-interactive state

---

### Requirement 8: Cross-Platform Consistency

**User Story:** As a developer, I want the input component to behave consistently across iOS, Android, and Web, so that I can use it without platform-specific workarounds.

#### Acceptance Criteria

1. THE ReusableInput SHALL render, accept text input, emit value changes, and display validation states on iOS, Android, and Web platforms without requiring consumers to use platform-conditional logic (such as `Platform.OS` checks or platform-specific props)
2. THE ReusableInput SHALL use NativeWind (Tailwind CSS) classes via `tailwind-variants` for all visual styling, with no inline `style` prop objects used for appearance
3. WHERE a `className` prop is provided, THE ReusableInput SHALL merge consumer classes with default styles using the `cn()` utility (tailwind-merge) so that conflicting properties are deduplicated with consumer classes taking precedence, applied to the outermost wrapper element

---

### Requirement 9: Controlled Component Contract

**User Story:** As a developer, I want the input to be a fully controlled component, so that form state management remains predictable and testable.

#### Acceptance Criteria

1. THE ReusableInput SHALL always display the value derived from the `value` prop (formatted for phone mode, direct for other modes)
2. THE ReusableInput SHALL never maintain internal text state that diverges from the `value` prop
3. WHEN the `value` prop updates externally, THE ReusableInput SHALL reflect the new value in the display within the same render cycle
4. WHEN the user types, deletes, or pastes text, THE ReusableInput SHALL invoke the `onChangeText` callback with the updated value before the next render, without updating the displayed text independently of the `value` prop
5. IF the `value` prop is undefined or null, THEN THE ReusableInput SHALL display an empty string

---

### Requirement 10: Phone Formatting Correctness

**User Story:** As a developer, I want the phone formatting to be lossless and bounded, so that data integrity is maintained and display overflow is prevented.

#### Acceptance Criteria

1. FOR ALL digit-only strings of length 1 to 10, THE Phone_Mask_Logic SHALL produce output where stripping all non-digit characters yields the original input unchanged (round-trip property)
2. FOR ALL input strings, THE Phone_Mask_Logic SHALL produce output no longer than 14 characters
3. FOR ALL input strings, THE Phone_Mask_Logic SHALL produce output containing only digits, parentheses, spaces, and hyphens
4. WHEN an empty string is provided, THE Phone_Mask_Logic SHALL return an empty string
5. WHEN the input contains characters that are not digits (0-9), THE Phone_Mask_Logic SHALL strip all non-digit characters before applying formatting
6. IF the stripped digit string exceeds 10 digits, THEN THE Phone_Mask_Logic SHALL format only the first 10 digits and discard the remainder
