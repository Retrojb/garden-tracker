import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

type TAvatarSize = 'sm' | 'md' | 'lg'

interface IAvatarProps {
  initials?: string
  src?: string
  size?: TAvatarSize
  onPress?: () => void
  className?: string
}

const avatarStyles = tv({
  slots: {
    base: 'rounded-full items-center justify-center bg-green-100 overflow-hidden',
    label: 'font-semibold text-green-800',
    image: 'w-full h-full',
  },
  variants: {
    size: {
      sm: {
        base: 'w-9 h-9',
        label: 'text-xs',
      },
      md: {
        base: 'w-16 h-16',
        label: 'text-base',
      },
      lg: {
        base: 'w-32 h-32',
        label: 'text-2xl',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Avatar = ({
  initials = 'JB',
  src,
  size = 'md',
  onPress,
  className,
}: IAvatarProps) => {
  const s = avatarStyles({ size })

  const content = (
    <View className={s.base({ className })}>
      {src ? (
        <Image
          source={{ uri: src }}
          className={s.image()}
          accessibilityLabel={`Avatar image`}
          resizeMode="cover"
        />
      ) : (
        <Text className={s.label()}>{initials}</Text>
      )}
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Avatar ${initials}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

export { Avatar }
export type { IAvatarProps, TAvatarSize }

