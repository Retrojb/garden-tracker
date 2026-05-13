import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

const GardenDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#4b7c59', fontSize: 14 }}>← Back</Text>
      </Pressable>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
          Garden Detail
        </Text>
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          ID: {id}
        </Text>
      </View>

      {/* Placeholder — replace with real plant data from usePlants() hook */}
      <View
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>
          Plant details coming soon
        </Text>
      </View>
    </ScrollView>
  )
}

export default GardenDetailScreen
