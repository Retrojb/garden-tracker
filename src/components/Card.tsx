import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

type ICardProps = {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  /** When provided the entire card becomes pressable */
  onPress?: () => void
}

const cardStyle = tv({
  slots: {
    base: 'flex-1 m-2 rounded-2xl bg-slate-300 p-4 border-red-300 border-2',
    header: 'flex flex-col pb-2 border-b border-gray-100',
    title: 'text-base font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-500 mt-0.5',
    body: 'mt-2',
    avatar:
      'w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto drop-shadow-lg',
  },
})

const Card = ({ title, subtitle, children, onPress }: ICardProps) => {
  const {
    base,
    header,
    title: titleCls,
    subtitle: subtitleCls,
    body,
  } = cardStyle()

  const content = (
    <View className={base()}>
      {(title || subtitle) && (
        <View className={header()}>
          {title && (
            <Text className={titleCls()} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className={subtitleCls()} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children && <View className={body()}>{children}</View>}
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

export { Card }
