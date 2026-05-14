import React from 'react'
import { Pressable, Text, View } from 'react-native'

import type { IEmptyStateProps } from '@/src/types/TEmptyState'

const EmptyState = ({ message, onAdd, className }: IEmptyStateProps) => {
  return (
    <View className={`items-center justify-center py-12 ${className ?? ''}`}>
      <Text className="text-gray-400 text-base mb-4">{message}</Text>
      {onAdd && (
        <Pressable
          onPress={onAdd}
          className="bg-indigo-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Plant</Text>
        </Pressable>
      )}
    </View>
  )
}

export { EmptyState }
