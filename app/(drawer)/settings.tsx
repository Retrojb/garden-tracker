/**
 * Settings / Profile screen
 *
 * Allows the user to manage their profile: name, nickname, and avatar photo.
 * Provides a sign-out action that clears all locally cached user data
 * (MMKV + SQLite) and navigates to the sign-in screen.
 *
 * Requirements: 7.5
 */

import { Avatar } from '@/src/components/Avatar'
import { useAuth } from '@/src/features/auth/AuthContext'
import { useUser } from '@/src/hooks/useUser'
import { signOut } from '@/src/lib/auth'
import Constants from 'expo-constants'
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
    title: 'font-[Manrope-Bold] text-2xl text-gray-900 mb-6',
    avatarWrap: 'items-center mb-6',
    avatarHint: 'font-[Manrope-Regular] text-xs text-gray-400 mt-2',
    label: 'font-[Manrope-Medium] text-sm text-gray-700 mb-1',
    input:
      'border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white mb-4 font-[Manrope-Regular]',
    emailSection: 'mb-6 px-1',
    emailLabel: 'font-[Manrope-Medium] text-sm text-gray-500',
    emailValue: 'font-[Manrope-Regular] text-base text-gray-900 mt-0.5',
    removeBtn: 'mt-1',
    removeBtnText: 'font-[Manrope-Regular] text-xs text-red-500',
    signOutSection: 'mt-8 pt-6 border-t border-gray-200',
    signOutBtn: 'rounded-2xl bg-red-600 py-3.5 items-center justify-center',
    signOutBtnText: 'text-white font-[Manrope-SemiBold] text-base',
    versionSection: 'mt-auto pb-8 items-center',
    versionText: 'font-[Manrope-Regular] text-xs text-gray-400',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const SettingsScreen = () => {
  const { user, updateUser, setAvatarUri } = useUser()
  const { session } = useAuth()
  const s = styles()

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

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

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <View className={s.container()}>
      <Text className={s.title()}>Settings</Text>

      {/* Avatar */}
      <View className={s.avatarWrap()}>
        <Avatar
          src={user.avatarUri ?? undefined}
          initials={user.name ? user.name.slice(0, 2).toUpperCase() : 'XX'}
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

      {/* Email (from auth session if available) */}
      {session ? (
        <View className={s.emailSection()}>
          <Text className={s.emailLabel()}>Signed in</Text>
          <Text className={s.emailValue()}>
            {user.name || 'Garden Tracker User'}
          </Text>
        </View>
      ) : null}

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

      {/* Sign Out */}
      <View className={s.signOutSection()}>
        <Pressable
          onPress={handleSignOut}
          className={s.signOutBtn()}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text className={s.signOutBtnText()}>Sign Out</Text>
        </Pressable>
      </View>

      {/* App Version */}
      <View className={s.versionSection()}>
        <Text className={s.versionText()}>
          Garden Tracker v{appVersion}
        </Text>
      </View>
    </View>
  )
}

export default SettingsScreen
