/**
 * useUser hook
 *
 * Manages user profile state persisted to MMKV storage.
 * Provides getters and setters for name, nickname, and avatar URI.
 */

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'

import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { IUser } from '@/src/types/TUser'

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

const USER_CACHE_KEY = 'user_profile'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_USER: IUser = {
  name: '',
  nickname: '',
  avatarUri: null,
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface UserState {
  user: IUser
  _setUser: (user: IUser) => void
}

const useUserStore = create<UserState>((set) => ({
  user: DEFAULT_USER,
  _setUser: (user) => set({ user }),
}))

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface IUseUserResult {
  user: IUser
  updateUser: (partial: Partial<IUser>) => void
  setAvatarUri: (uri: string | null) => void
}

const useUser = (): IUseUserResult => {
  const { user, _setUser } = useUserStore()

  // Load from storage on mount
  useEffect(() => {
    const cached = storageGet<IUser>(USER_CACHE_KEY)
    if (cached) {
      _setUser(cached)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateUser = useCallback(
    (partial: Partial<IUser>) => {
      const updated = { ...user, ...partial }
      _setUser(updated)
      storageSet<IUser>(USER_CACHE_KEY, updated)
    },
    [user, _setUser]
  )

  const setAvatarUri = useCallback(
    (uri: string | null) => {
      updateUser({ avatarUri: uri })
    },
    [updateUser]
  )

  return { user, updateUser, setAvatarUri }
}

export { useUser }
export type { IUseUserResult }

