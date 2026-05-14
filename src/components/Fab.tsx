import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable, Text } from 'react-native'
import { tv } from 'tailwind-variants'

interface IFabProps {
  iconName: React.ComponentProps<typeof FontAwesome>['name']
  onPress: () => void
  accessibilityLabel: string
  className?: string
}

const fabStyles = tv({
  slots: {
    base: 'absolute bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 items-center justify-center shadow-lg',
    icon: 'text-white',
  },
})

const Fab = ({ iconName, onPress, accessibilityLabel, className }: IFabProps) => {
  const fab = fabStyles()
  return (
    <Pressable
      className={fab.base({ className })}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Text className={fab.icon()}>
        <FontAwesome name={iconName} size={20} />
      </Text>
    </Pressable>
  )
}

export { Fab }
