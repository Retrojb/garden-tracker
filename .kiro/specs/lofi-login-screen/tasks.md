# Implementation Plan: LoFi Login Screen

## Overview

Implement the authentication layer for the Garden Tracker app using a provider-based abstraction. This includes auth types, a placeholder provider, React context, navigation guard, login screen UI, MMKV persistence, and root layout integration. Each task builds incrementally — types first, then provider, context, guard, UI, and finally wiring into the root layout.

## Tasks

- [x] 1. Define auth types and interfaces
  - [x] 1.1 Create auth provider and session type definitions
    - Create `src/types/TAuthProvider.ts` with `IAuthSession`, `ISignInCredentials`, and `IAuthProvider` interfaces
    - `IAuthSession` contains `accessToken` (string), `refreshToken` (string), `expiresAt` (number, Unix timestamp), `groups` (string[])
    - `ISignInCredentials` contains `email` (string) and `password` (string)
    - `IAuthProvider` defines `signIn`, `signOut`, `getSession`, `refreshSession` methods
    - Export all interfaces as named exports
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 1.2 Create Zod validation schemas for auth data
    - Create `src/features/auth/schemas.ts` with `loginFormSchema` and `authSessionSchema`
    - `loginFormSchema` validates email and password are non-empty after trimming
    - `authSessionSchema` validates persisted session shape (accessToken, refreshToken, expiresAt, groups)
    - _Requirements: 3.2, 6.4_

- [x] 2. Implement PlaceholderProvider
  - [x] 2.1 Create the PlaceholderProvider implementation
    - Create `src/features/auth/PlaceholderProvider.ts`
    - Implement `IAuthProvider` interface with static dummy session data
    - `signIn` returns a valid `IAuthSession` with dummy tokens and `expiresAt` 1 hour in the future
    - `signOut` resolves to void
    - `getSession` returns null (delegates to MMKV-based restoration in context)
    - `refreshSession` returns a refreshed dummy session
    - _Requirements: 8.7_

  - [x] 2.2 Write unit tests for PlaceholderProvider
    - Create `src/features/auth/__tests__/PlaceholderProvider.test.ts`
    - Verify `signIn` returns valid `IAuthSession` shape
    - Verify `signOut` resolves without error
    - Verify `getSession` returns null
    - Verify `refreshSession` returns valid session with updated token
    - _Requirements: 8.7_

- [x] 3. Implement AuthContext with MMKV persistence
  - [ ] 3.1 Create the AuthContext provider component
    - Create `src/features/auth/AuthContext.tsx`
    - Define `AuthStatus` type (`'loading' | 'authenticated' | 'unauthenticated'`)
    - Define `IAuthContextValue` interface with `status`, `session`, `groups`, `signIn`, `signOut`
    - Accept `IAuthProvider` as a prop (dependency injection)
    - On mount, read persisted session from MMKV using `auth_session` key, validate with `authSessionSchema`
    - On successful sign-in, persist session to MMKV
    - On sign-out, clear MMKV `auth_session` key and set state to unauthenticated (even if provider errors)
    - Expose `groups` from current session for IAM group-based authorization
    - _Requirements: 3.1, 4.4, 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.9_

  - [x] 3.2 Write property test: Valid credentials invoke provider and transition to authenticated (Property 2)
    - Create `src/features/auth/__tests__/AuthContext.property.test.tsx`
    - **Property 2: Valid credentials invoke provider and transition to authenticated**
    - Generate arbitrary non-whitespace email/password pairs with `fc.string().filter(s => s.trim().length > 0)`
    - Assert signIn calls provider with exact credentials and status transitions to `authenticated`
    - **Validates: Requirements 3.1**

  - [x] 3.3 Write property test: Whitespace-only inputs are rejected (Property 3)
    - Add to `src/features/auth/__tests__/AuthContext.property.test.tsx`
    - **Property 3: Whitespace-only inputs are rejected with validation errors**
    - Generate whitespace-only strings with `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))`
    - Assert form submission does not invoke provider and produces validation errors
    - **Validates: Requirements 3.2**

  - [x] 3.4 Write property test: Auth_Session persistence round-trip (Property 4)
    - Add to `src/features/auth/__tests__/AuthContext.property.test.tsx`
    - **Property 4: Auth_Session persistence round-trip**
    - Generate arbitrary valid sessions with `fc.record({ accessToken: fc.string({minLength:1}), refreshToken: fc.string({minLength:1}), expiresAt: fc.nat(), groups: fc.array(fc.string()) })`
    - Assert persisting to MMKV and reading back produces deeply equal object
    - **Validates: Requirements 6.1, 6.2, 8.9**

  - [ ]* 3.5 Write property test: Corrupt or missing persisted state defaults to unauthenticated (Property 5)
    - Add to `src/features/auth/__tests__/AuthContext.property.test.tsx`
    - **Property 5: Corrupt or missing persisted state defaults to unauthenticated**
    - Generate arbitrary strings and invalid JSON with `fc.oneof(fc.string(), fc.json())` filtered to exclude valid sessions
    - Assert Auth_Context sets status to `unauthenticated`
    - **Validates: Requirements 6.4**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement AuthGuard component
  - [x] 5.1 Create the AuthGuard navigation gating component
    - Create `src/features/auth/AuthGuard.tsx`
    - Consume `AuthContext` to read current `status`
    - When `loading`: render a full-screen loading indicator (ActivityIndicator centered)
    - When `unauthenticated`: render `LoginScreen`
    - When `authenticated`: render `children` (the drawer navigation)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Write unit tests for AuthGuard
    - Create `src/features/auth/__tests__/AuthGuard.test.tsx`
    - Verify loading indicator rendered when status is `loading`
    - Verify LoginScreen rendered when status is `unauthenticated`
    - Verify children rendered when status is `authenticated`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Implement LoginScreen UI
  - [x] 6.1 Create the LoginScreen component
    - Create `src/features/auth/LoginScreen.tsx`
    - Render heading with app name using Manrope-Bold font
    - Render `FormField` for email with `keyboardType="email-address"`, `autoCapitalize="none"`, `autoComplete="email"`
    - Render `FormField` for password with `secureTextEntry`, `autoComplete="password"`
    - Render `Button` for sign-in action
    - Center form vertically and horizontally; max-w-[480px] on wide viewports, full width with px-4 on narrow
    - Use NativeWind className-based styling only (no inline styles or StyleSheet.create)
    - Use Manrope font family for all text elements
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.2 Implement form state management and validation
    - Wire controlled inputs for email and password fields
    - On submit: validate with `loginFormSchema`, show inline validation errors below invalid fields
    - On valid submit: call `AuthContext.signIn` with credentials
    - While sign-in processing: disable button and show loading indicator in button
    - On sign-in failure: re-enable button, display error message above form
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.3 Write property test: Controlled input reflects user input (Property 1)
    - Create `src/features/auth/__tests__/LoginScreen.property.test.tsx`
    - **Property 1: Controlled input reflects user input**
    - Generate arbitrary strings with `fc.string()`
    - Assert displayed value equals input string exactly for both email and password fields
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 6.4 Write unit tests for LoginScreen
    - Create `src/features/auth/__tests__/LoginScreen.test.tsx`
    - Verify form elements present with correct accessibility props
    - Verify validation errors shown for empty/whitespace-only fields
    - Verify loading state disables button during sign-in
    - Verify error message displayed on sign-in failure
    - Verify responsive layout classes applied
    - _Requirements: 1.1, 1.4, 1.5, 3.2, 3.3, 3.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate auth layer into root layout
  - [x] 8.1 Modify root layout to wrap with AuthProvider and AuthGuard
    - Modify `app/_layout.tsx` to import `AuthProvider` and `AuthGuard`
    - Wrap `RootLayoutNav` content with `AuthProvider` (passing `PlaceholderProvider`)
    - Wrap drawer navigation and PageHeader inside `AuthGuard`
    - Ensure loading indicator shown while fonts load AND auth state resolves
    - _Requirements: 4.1, 4.2, 4.3, 8.1_

  - [x] 8.2 Add sign-out action to settings or drawer
    - Add a sign-out button/action accessible from the app (settings screen or drawer)
    - Wire to `AuthContext.signOut`
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Create feature type re-exports
  - [x] 9.1 Create auth feature types barrel file
    - Create `src/features/auth/types.ts` that re-exports from `src/types/TAuthProvider`
    - Update `src/types/index.ts` to export auth types
    - _Requirements: 8.1_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The PlaceholderProvider enables full flow development without a backend
- The AuthProvider interface supports future swap to CognitoProvider without modifying consuming components
- All components use named exports and the `const someFn = ({}:<>) => {}; export { someFn };` pattern
- NativeWind className-based styling only — no inline styles or StyleSheet.create

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```
