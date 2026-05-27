/**
 * Unit tests for the PhotoPicker component.
 *
 * Covers:
 *  1. Renders the "Add Photo" trigger button
 *  2. Opens action sheet modal when trigger is pressed
 *  3. Shows "Take Photo" and "Choose from Gallery" options
 *  4. Calls onImageSelected with URI after taking a photo
 *  5. Calls onImageSelected with URI after choosing from gallery
 *  6. Shows error when camera permission is denied
 *  7. Shows error when media library permission is denied
 *  8. Does not call onImageSelected when user cancels camera
 *  9. Does not call onImageSelected when user cancels gallery
 *
 * Requirements: 5.1, 5.2
 */

import { PhotoPicker } from '@/src/components/PhotoPicker'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import React from 'react'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}))

const mockedImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>

describe('PhotoPicker', () => {
  const mockOnImageSelected = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Add Photo trigger button', () => {
    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    expect(screen.getByLabelText('Add photo')).toBeTruthy()
    expect(screen.getByText('+ Add Photo')).toBeTruthy()
  })

  it('opens action sheet modal when trigger is pressed', () => {
    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))

    expect(screen.getByText('Take Photo')).toBeTruthy()
    expect(screen.getByText('Choose from Gallery')).toBeTruthy()
    expect(screen.getByText('Cancel')).toBeTruthy()
  })

  it('calls onImageSelected with URI after taking a photo', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })

    mockedImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg', width: 100, height: 100, type: 'image' }],
    } as ImagePicker.ImagePickerResult)

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Take Photo'))

    await waitFor(() => {
      expect(mockOnImageSelected).toHaveBeenCalledWith('file:///tmp/photo.jpg')
    })
  })

  it('calls onImageSelected with URI after choosing from gallery', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })

    mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/gallery.jpg', width: 200, height: 200, type: 'image' }],
    } as ImagePicker.ImagePickerResult)

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Choose from Gallery'))

    await waitFor(() => {
      expect(mockOnImageSelected).toHaveBeenCalledWith('file:///tmp/gallery.jpg')
    })
  })

  it('shows error when camera permission is denied', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED,
      granted: false,
      expires: 'never',
      canAskAgain: true,
    })

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Take Photo'))

    await waitFor(() => {
      expect(
        screen.getByText('Camera permission is required to take a photo.')
      ).toBeTruthy()
    })

    expect(mockOnImageSelected).not.toHaveBeenCalled()
  })

  it('shows error when media library permission is denied', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED,
      granted: false,
      expires: 'never',
      canAskAgain: true,
    })

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Choose from Gallery'))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Media library permission is required to choose a photo.'
        )
      ).toBeTruthy()
    })

    expect(mockOnImageSelected).not.toHaveBeenCalled()
  })

  it('does not call onImageSelected when user cancels camera', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })

    mockedImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    } as unknown as ImagePicker.ImagePickerResult)

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Take Photo'))

    // Give time for async operations to complete
    await waitFor(() => {
      expect(mockedImagePicker.launchCameraAsync).toHaveBeenCalled()
    })

    expect(mockOnImageSelected).not.toHaveBeenCalled()
  })

  it('does not call onImageSelected when user cancels gallery', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })

    mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    } as unknown as ImagePicker.ImagePickerResult)

    render(<PhotoPicker onImageSelected={mockOnImageSelected} />)

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Choose from Gallery'))

    await waitFor(() => {
      expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalled()
    })

    expect(mockOnImageSelected).not.toHaveBeenCalled()
  })

  it('passes maxGallerySelection to launchImageLibraryAsync', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })

    mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/img.jpg', width: 100, height: 100, type: 'image' }],
    } as ImagePicker.ImagePickerResult)

    render(
      <PhotoPicker onImageSelected={mockOnImageSelected} maxGallerySelection={5} />
    )

    fireEvent.press(screen.getByLabelText('Add photo'))
    fireEvent.press(screen.getByLabelText('Choose from Gallery'))

    await waitFor(() => {
      expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ selectionLimit: 5 })
      )
    })
  })
})
