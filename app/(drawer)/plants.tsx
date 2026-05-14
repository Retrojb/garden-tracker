import { MOCK_PLANTS } from '@/src/__mocks__/mockPlants'
import { Avatar } from '@/src/components/Avatar'
import { Card } from '@/src/components/Card'
import { WeatherHeader } from '@/src/features/WeatherHeader'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const PlantsScreen = () => {
  const router = useRouter()

  return (
    <View>
      <WeatherHeader initialZipCode="43206" />
      <ScrollView
        contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: 8,
        }}
      >
        {MOCK_PLANTS.map((plant) => (
          <View key={plant.id} style={{ width: '50%' }}>
            <Card
              title={plant.name}
              subtitle={plant.species}
              onPress={() => router.push(`/plants/${plant.id}`)}
            >
              {plant.variety ? (
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  {plant.variety}
                </Text>
              ) : null}
              <Avatar initials="JB" />
            </Card>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default PlantsScreen
