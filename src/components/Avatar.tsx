import { Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

type TAvatarProps = {
  children?: any
  initials?: string
  isPressable?: boolean
}

const avatar = tv({
  slots: {
    base: 'w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto drop-shadow-lg',
  },
})

const Avatar = ({ children, initials = 'JB', isPressable }: TAvatarProps) => {
  const { base } = avatar()
  return <View className={base()}>{initials && <Text>{initials}</Text>}</View>
}

export { Avatar }
