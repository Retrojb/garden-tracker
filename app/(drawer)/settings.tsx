/**
 * Settings screen
 *
 * Allows the user to manage their profile: name, nickname, and avatar photo.
 * Data is persisted locally via the useUser hook (MMKV).
 */

import { Avatar } from '@/src/components/Avatar'
import { useUser } from '@/src/hooks/useUser'
import * as ImagePicker from 'expo-image-picker'
import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-white px-5 pt-8',
    title: 'text-xl font-bold text-gray-900 mb-6',
    avatarWrap: 'items-center mb-6',
    avatarHint: 'text-xs text-gray-400 mt-2',
    label: 'text-sm font-medium text-gray-700 mb-1',
    input:
      'border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white mb-4',
    removeBtn: 'mt-1',
    removeBtnText: 'text-xs text-red-500',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const SettingsScreen = () => {
  const { user, updateUser, setAvatarUri } = useUser()
  const s = styles()

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  return (
    <View className={s.container()}>
      <Text className={s.title()}>Profile</Text>

      {/* Avatar */}
      <View className={s.avatarWrap()}>
        <Avatar
          src={user.avatarUri ?? undefined}
          initials={user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          size="lg"
          onPress={pickAvatar}
        />
        <Text className={s.avatarHint()}>Tap to change photo</Text>
        {user.avatarUri ? (
          <Pressable
            onPress={() => setAvatarUri(null)}
            className={s.removeBtn()}
            accessibilityRole="button"
            accessibilityLabel="Remove avatar"
          >
            <Text className={s.removeBtnText()}>Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Name */}
      <Text className={s.label()}>Name</Text>
      <TextInput
        className={s.input()}
        placeholder="Your name"
        value={user.name}
        onChangeText={(text) => updateUser({ name: text })}
        maxLength={60}
        accessibilityLabel="Name"
      />

      {/* Nickname */}
      <Text className={s.label()}>Nickname</Text>
      <TextInput
        className={s.input()}
        placeholder="Your nickname"
        value={user.nickname}
        onChangeText={(text) => updateUser({ nickname: text })}
        maxLength={30}
        accessibilityLabel="Nickname"
      />
    </View>
  )
}

export default SettingsScreen
