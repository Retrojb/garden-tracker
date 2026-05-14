import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'

import { Card } from '@/src/components/Card'
import { EmptyState } from '@/src/components/EmptyState'
import { PlantRow } from '@/src/components/PlantRow'
import { useGardens } from '@/src/hooks/useGardens'
import { usePlants } from '@/src/hooks/usePlants'

const GardenDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { gardens, isLoading: gardensLoading } = useGardens()
  const { plants, isLoading: plantsLoading } = usePlants(id ?? '')

  const garden = gardens.find((g) => g.id === id)
  const isLoading = gardensLoading || plantsLoading

  if (isLoading) {
    return <ActivityIndicator />
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Card title={garden?.name} variant="basic" />
      {plants.length > 0 ? (
        <PlantRow plants={plants} />
      ) : (
        <EmptyState message="No plants yet" />
      )}
    </ScrollView>
  )
}

export default GardenDetailScreen
