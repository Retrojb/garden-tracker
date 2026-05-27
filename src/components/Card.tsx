import type { CardVariant, ICardProps } from '@/src/types/TCard'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

const VALID_VARIANTS: CardVariant[] = ['compact', 'basic', 'detailed']

const cardStyle = tv({
  slots: {
    base: 'flex-1 m-2 rounded-2xl bg-mauve-300 border-4 border-indigo-200 shadow-md',
    header: 'flex flex-col pb-2 border-b border-gray-100',
    title: 'text-base font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-500 mt-0.5',
    body: 'mt-2',
  },
  variants: {
    variant: {
      compact: {
        base: 'p-2',
      },
      basic: {
        base: 'p-4 min-h-[200px]',
      },
      detailed: {
        base: 'p-6 min-h-[280px]',
      },
    },
  },
  defaultVariants: {
    variant: 'basic',
  },
})

const resolveVariant = (variant?: string): CardVariant => {
  if (variant && VALID_VARIANTS.includes(variant as CardVariant)) {
    return variant as CardVariant
  }
  return 'basic'
}

const Card = ({ title, subtitle, children, onPress, className, variant }: ICardProps) => {
  const resolvedVariant = resolveVariant(variant)

  const {
    base,
    header,
    title: titleCls,
    subtitle: subtitleCls,
    body,
  } = cardStyle({ variant: resolvedVariant })

  const showSubtitle = resolvedVariant !== 'compact'
  const showChildren = resolvedVariant === 'detailed'

  const content = (
    <View className={base({ className })}>
      {(title || (subtitle && showSubtitle)) && (
        <View className={header()}>
          {title && (
            <Text className={titleCls()} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && showSubtitle && (
            <Text className={subtitleCls()} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children && showChildren && <View className={body()}>{children}</View>}
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
