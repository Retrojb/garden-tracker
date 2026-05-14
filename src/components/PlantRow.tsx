import React from 'react'
import { View } from 'react-native'

import { Card } from '@/src/components/Card'
import type { IPlantRowProps } from '@/src/types/TPlantRow'

const PlantRow = ({ plants, className }: IPlantRowProps) => {
  return (
    <View
      className={`flex-row flex-wrap mt-4 sm:gap-2 md:gap-3 lg:gap-4 ${className ?? ''}`}
    >
      {plants.map((plant) => (
        <Card key={plant.id} title={plant.name} variant="compact" />
      ))}
    </View>
  )
}

export { PlantRow }
