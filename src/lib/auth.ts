/**
 * Authentication helpers: token refresh, sign-out, and auth event emitter.
 *
 * - Auto-refreshes Cognito JWT on expiry via Amplify's `fetchAuthSession`.
 * - Emits `TOKEN_REFRESH_FAILED` when refresh fails so the UI can prompt
 *   re-authentication.
 * - `signOut` clears all local caches (MMKV + SQLite mutation queue),
 *   calls Amplify sign-out, and navigates to the sign-in screen.
 *
 * Requirements: 7.2, 7.3, 7.5
 */

import { fetchAuthSession } from 'aws-amplify/auth'
import { router } from 'expo-router'

import type {
    AuthEventListener,
    IAuthEvent,
    IAuthEventEmitter,
} from '../types/TAuth'
import { signOut as amplifySignOut } from './amplify'
import { clearMutationQueue } from './mutationQueueClear'
import { clear as clearStorage } from './storage'

// ---------------------------------------------------------------------------
// Auth Event Emitter
// ---------------------------------------------------------------------------

/**
 * Creates an event emitter for auth state changes.
 * Components subscribe to receive notifications when token refresh fails
 * or the user signs out.
 */
const createAuthEventEmitter = (): IAuthEventEmitter => {
  const listeners = new Set<AuthEventListener>()

  const subscribe = (listener: AuthEventListener): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const emit = (event: IAuthEvent): void => {
    listeners.forEach((listener) => listener(event))
  }

  const clear = (): void => {
    listeners.clear()
  }

  return { subscribe, emit, clear }
}

/** Singleton auth event emitter instance. */
const authEvents: IAuthEventEmitter = createAuthEventEmitter()

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

/**
 * Attempts to refresh the Cognito JWT token.
 *
 * Amplify's `fetchAuthSession` handles the actual token refresh automatically.
 * This function wraps it to detect failures and emit an event that triggers
 * the re-authentication prompt.
 *
 * @returns The refreshed access token string, or null on failure.
 */
const refreshToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession({ forceRefresh: true })
    const token = session.tokens?.accessToken?.toString() ?? null

    if (!token) {
      authEvents.emit({
        type: 'TOKEN_REFRESH_FAILED',
        error: new Error('No access token returned after refresh'),
      })
      return null
    }

    return token
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    authEvents.emit({ type: 'TOKEN_REFRESH_FAILED', error })
    return null
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

/**
 * Signs the user out completely:
 * 1. Clears MMKV local storage (cached data, preferences)
 * 2. Clears SQLite mutation queue (pending offline mutations)
 * 3. Calls Amplify signOut to clear Cognito session
 * 4. Emits SIGNED_OUT event
 * 5. Navigates to the sign-in screen
 */
const signOut = async (): Promise<void> => {
  // Clear local caches
  clearStorage()
  await clearMutationQueue()

  // Clear Amplify/Cognito session
  await amplifySignOut()

  // Notify subscribers
  authEvents.emit({ type: 'SIGNED_OUT' })

  // Navigate to sign-in screen
  router.replace('/(auth)/sign-in' as never)
}

export { authEvents, createAuthEventEmitter, refreshToken, signOut }
