/**
 * Modal
 *
 * A generic bottom-sheet modal composed of Header, Body, and Footer slots.
 * Consumers compose their content using the sub-components:
 *
 *   <Modal visible={…} onClose={…}>
 *     <ModalHeader title="…" onClose={…} />
 *     <ModalBody>…</ModalBody>
 *     <ModalFooter>…</ModalFooter>
 *   </Modal>
 */

import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as RNModal,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { tv } from 'tailwind-variants'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const modalStyles = tv({
  slots: {
    overlay: 'flex-1 justify-end bg-black/40',
    sheet: 'bg-white rounded-t-3xl px-5 pt-4 pb-8',
    handle: 'w-10 h-1 rounded-full bg-gray-300 self-center mb-4',
    header: 'flex-row items-center justify-between mb-5',
    title: 'text-lg font-bold text-gray-900',
    closeBtn: 'w-8 h-8 items-center justify-center rounded-full bg-gray-100',
    closeBtnText: 'text-gray-500 text-base leading-none',
    body: '',
    footer: 'mt-2',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

interface IModalHeaderProps {
  title: string
  onClose: () => void
}

interface IModalBodyProps {
  children: React.ReactNode
}

interface IModalFooterProps {
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ModalHeader = ({ title, onClose }: IModalHeaderProps) => {
  const s = modalStyles()
  return (
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
  )
}

const ModalBody = ({ children }: IModalBodyProps) => {
  const s = modalStyles()
  return (
    <ScrollView
      className={s.body()}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

const ModalFooter = ({ children }: IModalFooterProps) => {
  const s = modalStyles()
  return <View className={s.footer()}>{children}</View>
}

// ---------------------------------------------------------------------------
// Root Modal
// ---------------------------------------------------------------------------

const Modal = ({ visible, onClose, children }: IModalProps) => {
  const s = modalStyles()
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      allowSwipeDismissal
      presentationStyle='fullScreen'
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={s.overlay()}
      >
        <View className={s.sheet()}>
          <View className={s.handle()} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

export { Modal, ModalBody, ModalFooter, ModalHeader }
export type { IModalBodyProps, IModalFooterProps, IModalHeaderProps, IModalProps }

