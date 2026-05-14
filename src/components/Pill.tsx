import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

interface IPillProps {
    text: string
    onPress?: () => void
    className?: string
}

const pillStyles = tv({
    slots: {
        base: 'rounded-full px-3 py-1.5 bg-green-600 self-start',
        label: 'text-xs font-medium text-white',
    },
})

const Pill = ({ text, onPress, className }: IPillProps) => {
    const s = pillStyles()

    const content = (
        <View className={s.base({ className })}>
            <Text className={s.label()}>{text}</Text>
        </View>
    )

    if (onPress) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={text}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
            {content}
        </Pressable>
    )
  }

    return content
}

export { Pill }
export type { IPillProps }

