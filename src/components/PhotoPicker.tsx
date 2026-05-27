/**
 * PhotoPicker
 *
 * Composite component for capturing or selecting photos. Presents an action
 * sheet with "Take Photo" and "Choose from Gallery" options. Delegates to
 * expo-image-picker for permission requests and image selection, then returns
 * the local URI to the parent via the `onImageSelected` callback.
 *
 * Requirements: 5.1, 5.2
 */

import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import { Modal } from './Modal'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: '',
    optionButton: 'py-4 border-b border-gray-100',
    optionText: 'text-base text-center text-gray-900 font-medium',
    cancelButton: 'py-4 mt-2',
    cancelText: 'text-base text-center text-red-500 font-medium',
    errorText: 'text-xs text-red-500 mt-2 text-center',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IPhotoPickerProps {
  /** Called with the local URI of the selected/captured image */
  onImageSelected: (uri: string) => void
  /** Maximum number of images selectable from gallery (defaults to 1) */
  maxGallerySelection?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PhotoPicker = ({
  onImageSelected,
  maxGallerySelection = 1,
}: IPhotoPickerProps) => {
  const s = styles()

  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = useCallback(() => {
    setError(null)
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    setVisible(false)
  }, [])

  // -------------------------------------------------------------------------
  // Take Photo — request camera permission and launch camera (Req 5.1)
  // -------------------------------------------------------------------------

  const handleTakePhoto = useCallback(async () => {
    close()
    setError(null)

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        setError('Camera permission is required to take a photo.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      onImageSelected(result.assets[0].uri)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to capture photo.'
      )
    }
  }, [close, onImageSelected])

  // -------------------------------------------------------------------------
  // Choose from Gallery — request media library permission and open picker
  // (Req 5.2)
  // -------------------------------------------------------------------------

  const handleChooseFromGallery = useCallback(async () => {
    close()
    setError(null)

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        setError('Media library permission is required to choose a photo.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        selectionLimit: maxGallerySelection,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      // Return the first selected image URI
      onImageSelected(result.assets[0].uri)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to select photo.'
      )
    }
  }, [close, maxGallerySelection, onImageSelected])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View className={s.container()}>
      {/* Trigger button — consumers can also call `open` via ref if needed */}
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="Add photo"
      >
        <Text className="text-base text-green-700 font-semibold text-center py-3">
          + Add Photo
        </Text>
      </Pressable>

      {error ? <Text className={s.errorText()}>{error}</Text> : null}

      {/* Action sheet modal */}
      <Modal visible={visible} onClose={close}>
        <View>
          <Pressable
            onPress={handleTakePhoto}
            className={s.optionButton()}
            accessibilityRole="button"
            accessibilityLabel="Take Photo"
          >
            <Text className={s.optionText()}>Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={handleChooseFromGallery}
            className={s.optionButton()}
            accessibilityRole="button"
            accessibilityLabel="Choose from Gallery"
          >
            <Text className={s.optionText()}>Choose from Gallery</Text>
          </Pressable>

          <Pressable
            onPress={close}
            className={s.cancelButton()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text className={s.cancelText()}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

export { PhotoPicker }
export type { IPhotoPickerProps }

