/**
 * Property-based tests for AuthContext.
 *
 * Feature: lofi-login-screen
 * Property 2: Valid credentials invoke provider and transition to authenticated
 * Property 3: Whitespace-only inputs are rejected with validation errors
 * Property 4: Auth_Session persistence round-trip
 *
 * Validates: Requirements 3.1, 3.2, 6.1, 6.2, 8.9
 */

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native'
import fc from 'fast-check'
import React from 'react'

import { clear, get, set } from '@/src/lib/storage'
import type { IAuthProvider, IAuthSession } from '@/types/TAuthProvider'

import { AuthProvider, useAuth } from '../AuthContext'
import { LoginScreen } from '../LoginScreen'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockSession = (): IAuthSession => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  groups: [],
})

const createMockProvider = (overrides?: Partial<IAuthProvider>): IAuthProvider => ({
  signIn: jest.fn().mockResolvedValue(createMockSession()),
  signOut: jest.fn().mockResolvedValue(undefined),
  getSession: jest.fn().mockResolvedValue(null),
  refreshSession: jest.fn().mockResolvedValue(createMockSession()),
  ...overrides,
})

const createWrapper = (provider: IAuthProvider) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider provider={provider}>{children}</AuthProvider>
  )
  return Wrapper
}

// ---------------------------------------------------------------------------
// Property 2: Valid credentials invoke provider and transition to authenticated
// ---------------------------------------------------------------------------

describe('Feature: lofi-login-screen, Property 2: Valid credentials invoke provider and transition to authenticated', () => {
  beforeEach(() => {
    clear()
  })

  it('for any non-whitespace email/password pair, signIn calls provider with exact credentials and transitions to authenticated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s.trim().length > 0),
        fc.string().filter((s) => s.trim().length > 0),
        async (email, password) => {
          // Clear persisted state before each iteration to ensure clean slate
          clear()

          const mockProvider = createMockProvider()
          const { result, unmount } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockProvider),
          })

          // Wait for initial loading state to resolve to unauthenticated
          await waitFor(() => {
            expect(result.current.status).not.toBe('loading')
          })

          expect(result.current.status).toBe('unauthenticated')

          // Invoke signIn with the generated credentials
          await act(async () => {
            await result.current.signIn({ email, password })
          })

          // Assert provider was called with exact credentials
          expect(mockProvider.signIn).toHaveBeenCalledWith({ email, password })

          // Assert status transitioned to authenticated
          expect(result.current.status).toBe('authenticated')

          // Cleanup to prevent state leaking between iterations
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})


// ---------------------------------------------------------------------------
// Property 3: Whitespace-only inputs are rejected with validation errors
// ---------------------------------------------------------------------------

describe('Feature: lofi-login-screen, Property 3: Whitespace-only inputs are rejected', () => {
  beforeEach(() => {
    clear()
  })

  it('for any whitespace-only email, form submission does not invoke provider and produces a validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
        async (whitespaceEmail) => {
          clear()

          const mockProvider = createMockProvider()

          const { unmount } = render(
            <AuthProvider provider={mockProvider}>
              <LoginScreen />
            </AuthProvider>
          )

          // Wait for auth state to resolve
          await waitFor(() => {
            expect(screen.getByLabelText('Email')).toBeTruthy()
          })

          // Type whitespace-only string into email, valid password
          const emailInput = screen.getByLabelText('Email')
          const passwordInput = screen.getByLabelText('Password')

          fireEvent.changeText(emailInput, whitespaceEmail)
          fireEvent.changeText(passwordInput, 'validPassword123')

          // Press sign-in button
          const signInButton = screen.getByRole('button', { name: 'Sign In' })
          await act(async () => {
            fireEvent.press(signInButton)
          })

          // Assert provider signIn was NOT called
          expect(mockProvider.signIn).not.toHaveBeenCalled()

          // Assert validation error is displayed for email field
          expect(screen.getByText('Email is required')).toBeTruthy()

          unmount()
        }
      ),
      { numRuns: 20 }
    )
  }, 30_000)

  it('for any whitespace-only password, form submission does not invoke provider and produces a validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
        async (whitespacePassword) => {
          clear()

          const mockProvider = createMockProvider()

          const { unmount } = render(
            <AuthProvider provider={mockProvider}>
              <LoginScreen />
            </AuthProvider>
          )

          // Wait for auth state to resolve
          await waitFor(() => {
            expect(screen.getByLabelText('Email')).toBeTruthy()
          })

          // Type valid email, whitespace-only password
          const emailInput = screen.getByLabelText('Email')
          const passwordInput = screen.getByLabelText('Password')

          fireEvent.changeText(emailInput, 'user@example.com')
          fireEvent.changeText(passwordInput, whitespacePassword)

          // Press sign-in button
          const signInButton = screen.getByRole('button', { name: 'Sign In' })
          await act(async () => {
            fireEvent.press(signInButton)
          })

          // Assert provider signIn was NOT called
          expect(mockProvider.signIn).not.toHaveBeenCalled()

          // Assert validation error is displayed for password field
          expect(screen.getByText('Password is required')).toBeTruthy()

          unmount()
        }
      ),
      { numRuns: 20 }
    )
  }, 30_000)

  it('for any whitespace-only email AND password, form submission does not invoke provider and produces validation errors for both fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
        fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
        async (whitespaceEmail, whitespacePassword) => {
          clear()

          const mockProvider = createMockProvider()

          const { unmount } = render(
            <AuthProvider provider={mockProvider}>
              <LoginScreen />
            </AuthProvider>
          )

          // Wait for auth state to resolve
          await waitFor(() => {
            expect(screen.getByLabelText('Email')).toBeTruthy()
          })

          // Type whitespace-only strings into both fields
          const emailInput = screen.getByLabelText('Email')
          const passwordInput = screen.getByLabelText('Password')

          fireEvent.changeText(emailInput, whitespaceEmail)
          fireEvent.changeText(passwordInput, whitespacePassword)

          // Press sign-in button
          const signInButton = screen.getByRole('button', { name: 'Sign In' })
          await act(async () => {
            fireEvent.press(signInButton)
          })

          // Assert provider signIn was NOT called
          expect(mockProvider.signIn).not.toHaveBeenCalled()

          // Assert validation errors are displayed for both fields
          expect(screen.getByText('Email is required')).toBeTruthy()
          expect(screen.getByText('Password is required')).toBeTruthy()

          unmount()
        }
      ),
      { numRuns: 20 }
    )
  }, 30_000)
})


// ---------------------------------------------------------------------------
// Property 4: Auth_Session persistence round-trip
// ---------------------------------------------------------------------------

describe('Feature: lofi-login-screen, Property 4: Auth_Session persistence round-trip', () => {
  beforeEach(() => {
    clear()
  })

  /**
   * Validates: Requirements 6.1, 6.2
   *
   * For any valid IAuthSession, persisting to MMKV and reading back produces
   * a deeply equal object.
   */
  it('for any valid session, persisting to MMKV and reading back produces a deeply equal object', () => {
    fc.assert(
      fc.property(
        fc.record({
          accessToken: fc.string({ minLength: 1 }),
          refreshToken: fc.string({ minLength: 1 }),
          expiresAt: fc.integer({ min: 1 }),
          groups: fc.array(fc.string()),
        }),
        (session) => {
          clear()

          // Persist the session (simulating what AuthContext does on sign-in)
          set('auth_session', session)

          // Read it back (simulating what AuthContext does on mount)
          const restored = get<IAuthSession>('auth_session')

          // Assert the read-back value is deeply equal to the original
          expect(restored).toEqual(session)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Validates: Requirements 6.2, 8.9
   *
   * For any valid IAuthSession persisted to MMKV, the AuthContext SHALL
   * restore the session on mount and expose the same groups array.
   */
  it('for any valid session persisted to MMKV, AuthContext restores it and exposes the same groups', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessToken: fc.string({ minLength: 1 }),
          refreshToken: fc.string({ minLength: 1 }),
          expiresAt: fc.integer({ min: 1 }),
          groups: fc.array(fc.string()),
        }),
        async (session) => {
          clear()

          // Pre-persist the session to MMKV (simulating a previous sign-in)
          set('auth_session', session)

          const mockProvider = createMockProvider()
          const { result, unmount } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockProvider),
          })

          // Wait for AuthContext to finish restoring from MMKV
          await waitFor(() => {
            expect(result.current.status).not.toBe('loading')
          })

          // Assert status is authenticated (valid session was restored)
          expect(result.current.status).toBe('authenticated')

          // Assert the restored session is deeply equal to the original
          expect(result.current.session).toEqual(session)

          // Assert the groups array from the restored session matches
          expect(result.current.groups).toEqual(session.groups)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
