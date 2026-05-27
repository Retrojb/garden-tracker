/**
 * AuthGuard navigation gating component.
 *
 * Conditionally renders based on Auth_Context status:
 * - loading: full-screen loading indicator
 * - unauthenticated: LoginScreen
 * - authenticated: children (drawer navigation)
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { ActivityIndicator, View } from 'react-native'

import { useAuth } from './AuthContext'
import { LoginScreen } from './LoginScreen'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IAuthGuardProps {
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuthGuard = ({ children }: IAuthGuardProps) => {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />
  }

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { AuthGuard }
export type { IAuthGuardProps }

