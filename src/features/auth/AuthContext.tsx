/**
 * AuthContext provider component.
 *
 * Manages authentication state with MMKV persistence and delegates
 * auth operations to an injected IAuthProvider. Exposes status, session,
 * groups, signIn, and signOut to the component tree.
 *
 * Requirements: 3.1, 4.4, 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.9
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { deleteKey, get, set } from '@/src/lib/storage'
import type { IAuthProvider, IAuthSession, ISignInCredentials } from '@/types/TAuthProvider'

import { authSessionSchema } from './schemas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface IAuthContextValue {
  status: AuthStatus
  session: IAuthSession | null
  groups: string[]
  signIn: (credentials: ISignInCredentials) => Promise<void>
  signOut: () => Promise<void>
}

interface IAuthProviderProps {
  provider: IAuthProvider
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTH_SESSION_KEY = 'auth_session'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<IAuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const AuthProvider = ({ provider, children }: IAuthProviderProps) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<IAuthSession | null>(null)

  // On mount: read persisted session from MMKV, validate with authSessionSchema
  useEffect(() => {
    const restoreSession = () => {
      const persisted = get<unknown>(AUTH_SESSION_KEY)
      const result = authSessionSchema.safeParse(persisted)

      if (result.success) {
        setSession(result.data)
        setStatus('authenticated')
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    }

    restoreSession()
  }, [])

  const signIn = async (credentials: ISignInCredentials): Promise<void> => {
    const newSession = await provider.signIn(credentials)
    set(AUTH_SESSION_KEY, newSession)
    setSession(newSession)
    setStatus('authenticated')
  }

  const signOut = async (): Promise<void> => {
    try {
      await provider.signOut()
    } catch {
      // Sign-out always clears local state regardless of provider errors
    } finally {
      deleteKey(AUTH_SESSION_KEY)
      setSession(null)
      setStatus('unauthenticated')
    }
  }

  const groups = useMemo(() => session?.groups ?? [], [session])

  const value: IAuthContextValue = useMemo(
    () => ({ status, session, groups, signIn, signOut }),
    [status, session, groups]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const useAuth = (): IAuthContextValue => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { AUTH_SESSION_KEY, AuthProvider, useAuth }
export type { AuthStatus, IAuthContextValue, IAuthProviderProps }

