/**
 * FormModal
 *
 * A reusable bottom-sheet modal that animates in/out using react-native-reanimated.
 * Provides a consistent header with title and close button, handles keyboard
 * avoidance, and wraps arbitrary form content passed as children.
 *
 * Requirements: 2.1, 4.1
 */

import React, { useEffect } from 'react'
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native'
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_HEIGHT = Dimensions.get('window').height
const ANIMATION_DURATION = 300

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    overlay: 'absolute inset-0 justify-end',
    sheet: 'bg-white rounded-t-3xl px-5 pt-4 pb-8',
    handle: 'w-10 h-1 rounded-full bg-gray-300 self-center mb-4',
    header: 'flex-row items-center justify-between mb-5',
    title: 'text-lg font-bold text-gray-900',
    closeBtn: 'w-8 h-8 items-center justify-center rounded-full bg-gray-100',
    closeBtnText: 'text-gray-500 text-base leading-none',
    backdrop: 'absolute inset-0',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IFormModalProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Title displayed in the modal header */
  title: string
  /** Callback invoked when the modal is closed */
  onClose: () => void
  /** Form content rendered inside the modal body */
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormModal = ({ visible, title, onClose, children }: IFormModalProps) => {
  const s = styles()

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const backdropOpacity = useSharedValue(0)
  const isRendered = useSharedValue(false)

  const [shouldRender, setShouldRender] = React.useState(false)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      isRendered.value = true
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION })
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION })
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: ANIMATION_DURATION }, (finished) => {
        if (finished) {
          isRendered.value = false
          runOnJS(setShouldRender)(false)
        }
      })
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION })
    }
  }, [visible, translateY, backdropOpacity, isRendered])

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!shouldRender) {
    return null
  }

  return (
    <View
      className={s.overlay()}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityViewIsModal={visible}
    >
      {/* Backdrop */}
      <Animated.View
        className={s.backdrop()}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }, backdropAnimatedStyle]}
      >
        <Pressable
          className={s.backdrop()}
          onPress={onClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ justifyContent: 'flex-end', flex: 1 }}
        pointerEvents="box-none"
      >
        <Animated.View
          className={s.sheet()}
          style={sheetAnimatedStyle}
          accessibilityRole="none"
        >
          {/* Handle */}
          <View className={s.handle()} />

          {/* Header */}
          <View className={s.header()}>
            <Text className={s.title()}>{title}</Text>
            <Pressable
              onPress={onClose}
              className={s.closeBtn()}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Text className={s.closeBtnText()}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

export { FormModal }
export type { IFormModalProps }

