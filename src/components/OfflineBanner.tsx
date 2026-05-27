import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { Text, View } from 'react-native'

/**
 * Displays a persistent banner when the device has no network connectivity.
 * Automatically hides when connectivity is restored.
 *
 * Uses @react-native-community/netinfo to detect connectivity changes.
 *
 * @requirements 8.4
 */
const OfflineBanner = () => {
  const netInfo = useNetInfo()

  // Don't show banner while connectivity state is still being determined
  if (netInfo.isConnected === null) {
    return null
  }

  if (netInfo.isConnected) {
    return null
  }

  return (
    <View
      className="bg-red-600 px-4 py-2 items-center justify-center"
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
      testID="offline-banner"
    >
      <Text className="text-white text-sm font-semibold">
        No internet connection
      </Text>
    </View>
  )
}

export { OfflineBanner }
