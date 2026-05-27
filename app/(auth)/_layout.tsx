/**
 * Auth route group layout.
 *
 * Redirects authenticated users away from auth screens to the main app.
 * Unauthenticated users see the auth screens (sign-in).
 *
 * Requirements: 7.1, 7.3
 */

import { useAuth } from '@/src/features/auth/AuthContext'
import { Redirect, Stack } from 'expo-router'

const AuthLayout = (): React.ReactElement => {
  const { status } = useAuth()

  // Redirect authenticated users to the main app
  if (status === 'authenticated') {
    return <Redirect href="/(drawer)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  )
}

export { AuthLayout as default }
