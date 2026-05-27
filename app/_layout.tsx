import PageHeader from '@/src/components/navigation/PageHeader'
import { OfflineBanner } from '@/src/components/OfflineBanner'
import { AuthProvider, useAuth } from '@/src/features/auth/AuthContext'
import { PlaceholderProvider } from '@/src/features/auth/PlaceholderProvider'
import { useFonts } from 'expo-font'
import { Redirect, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import 'react-native-reanimated'
import '../index.css'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(drawer)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const RootLayout = (): React.ReactElement | null => {
  const [loaded, error] = useFonts({
    ManropeExtraLight: require('../assets/fonts/Manrope-ExtraLight.ttf'),
    ManropeLight: require('../assets/fonts/Manrope-Light.ttf'),
    ManropeRegular: require('../assets/fonts/Manrope-Regular.ttf'),
    ManropeMedium: require('../assets/fonts/Manrope-Medium.ttf'),
    ManropeSemiBold: require('../assets/fonts/Manrope-SemiBold.ttf'),
    ManropeBold: require('../assets/fonts/Manrope-Bold.ttf'),
    ManropeExtraBold: require('../assets/fonts/Manrope-ExtraBold.ttf'),
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return <RootLayoutNav />
}

const RootLayoutNav = (): React.ReactElement => {
  return (
    <AuthProvider provider={PlaceholderProvider}>
      <OfflineBanner />
      <AuthGate />
    </AuthProvider>
  )
}

/**
 * AuthGate handles navigation-based auth routing.
 *
 * - loading: shows a full-screen spinner
 * - unauthenticated: redirects to (auth)/sign-in
 * - authenticated: renders the main app stack
 *
 * Requirements: 7.1, 7.3
 */
const AuthGate = (): React.ReactElement => {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (status === 'unauthenticated') {
    return <Redirect href={'/(auth)/sign-in' as never} />
  }

  return (
    <>
      <PageHeader />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="plants/[id]" options={{ title: 'Plant Detail' }} />
        <Stack.Screen name="gardens/[id]" options={{ title: 'Garden Detail' }} />
      </Stack>
    </>
  )
}

export { RootLayout as default }
