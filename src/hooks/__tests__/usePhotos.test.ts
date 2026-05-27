/**
 * Unit tests for the usePhotos hook.
 *
 * Covers:
 *  1. fetchPhotos loads photos from API on mount
 *  2. capturePhoto requests camera permission and stores locally — Req 5.1, 5.3
 *  3. pickFromGallery requests media library permission and stores locally — Req 5.2, 5.3
 *  4. Upload flow: presigned URL → S3 PUT → persist metadata — Req 5.4, 5.5
 *  5. On presigned URL failure, retains local photo with s3Key unset — Req 5.6
 *  6. On non-200 S3 response, retains local photo with s3Key unset — Req 5.7
 *  7. deletePhoto removes from list and calls API — Req 5.8
 *  8. Error state is set on API failure — Req 9.3
 *  9. Camera permission denied sets error
 * 10. Media library permission denied sets error
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('@/src/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

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

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/app/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '@/src/lib/apiClient'
import type { IPhoto } from '@/src/types/TPhoto'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { usePhotos } from '../usePhotos'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>
const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>
const mockApiDelete = apiClient.delete as jest.MockedFunction<
  typeof apiClient.delete
>

const mockRequestCameraPermissions =
  ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestCameraPermissionsAsync
  >
const mockRequestMediaLibraryPermissions =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestMediaLibraryPermissionsAsync
  >
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.MockedFunction<
  typeof ImagePicker.launchCameraAsync
>
const mockLaunchImageLibrary =
  ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
    typeof ImagePicker.launchImageLibraryAsync
  >

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.MockedFunction<
  typeof FileSystem.getInfoAsync
>
const mockMakeDirectoryAsync =
  FileSystem.makeDirectoryAsync as jest.MockedFunction<
    typeof FileSystem.makeDirectoryAsync
  >
const mockCopyAsync = FileSystem.copyAsync as jest.MockedFunction<
  typeof FileSystem.copyAsync
>
const mockReadAsStringAsync =
  FileSystem.readAsStringAsync as jest.MockedFunction<
    typeof FileSystem.readAsStringAsync
  >

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PHOTO_A: IPhoto = {
  id: 'photo-1',
  gardenId: 'garden-1',
  plantId: 'plant-1',
  localUri: 'file:///data/app/photos/photo_abc.jpg',
  s3Key: 'photos/garden-1/photo-1.jpg',
  takenAt: '2024-03-15T10:00:00.000Z',
}

const PHOTO_B: IPhoto = {
  id: 'photo-2',
  plantId: 'plant-1',
  localUri: 'file:///data/app/photos/photo_def.jpg',
  s3Key: 'photos/plant-1/photo-2.jpg',
  takenAt: '2024-03-16T10:00:00.000Z',
}

// Mock global fetch for S3 upload
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock atob for base64 decoding
global.atob = jest.fn((str: string) => str)

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
  mockMakeDirectoryAsync.mockResolvedValue(undefined as never)
  mockCopyAsync.mockResolvedValue(undefined as never)
  mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')
  mockFetch.mockResolvedValue({ status: 200 })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePhotos', () => {
  // -------------------------------------------------------------------------
  // 1. fetchPhotos loads photos from API on mount
  // -------------------------------------------------------------------------
  it('fetches photos from the API on mount and sets state', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PHOTO_A, PHOTO_B],
      status: 200,
    })

    const { result } = renderHook(() =>
      usePhotos({ gardenId: 'garden-1', plantId: 'plant-1' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/photos', {
      queryParams: { gardenId: 'garden-1', plantId: 'plant-1' },
    })
    expect(result.current.photos).toEqual([PHOTO_A, PHOTO_B])
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 2. capturePhoto requests camera permission and stores locally
  // -------------------------------------------------------------------------
  it('capturePhoto requests camera permission, opens camera, and stores locally', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/camera_photo.jpg', width: 100, height: 100, type: 'image' }],
    } as never)
    mockApiPost
      .mockResolvedValueOnce({
        data: { uploadUrl: 'https://s3.example.com/upload', s3Key: 'photos/test.jpg' },
        status: 200,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'photo-new',
          localUri: 'file:///data/app/photos/photo_abc.jpg',
          s3Key: 'photos/test.jpg',
          takenAt: '2024-03-15T10:00:00.000Z',
        },
        status: 201,
      })

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    expect(mockRequestCameraPermissions).toHaveBeenCalled()
    expect(mockLaunchCamera).toHaveBeenCalled()
    expect(mockCopyAsync).toHaveBeenCalled()
    expect(result.current.photos.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // 3. pickFromGallery requests media library permission and stores locally
  // -------------------------------------------------------------------------
  it('pickFromGallery requests media library permission, opens picker, and stores locally', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestMediaLibraryPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchImageLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/gallery_photo.jpg', width: 100, height: 100, type: 'image' }],
    } as never)
    mockApiPost
      .mockResolvedValueOnce({
        data: { uploadUrl: 'https://s3.example.com/upload', s3Key: 'photos/test.jpg' },
        status: 200,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'photo-new',
          localUri: 'file:///data/app/photos/photo_abc.jpg',
          s3Key: 'photos/test.jpg',
          takenAt: '2024-03-15T10:00:00.000Z',
        },
        status: 201,
      })

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.pickFromGallery()
    })

    expect(mockRequestMediaLibraryPermissions).toHaveBeenCalled()
    expect(mockLaunchImageLibrary).toHaveBeenCalled()
    expect(mockCopyAsync).toHaveBeenCalled()
    expect(result.current.photos.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // 4. Upload flow: presigned URL → S3 PUT → persist metadata
  // -------------------------------------------------------------------------
  it('completes full upload flow: presigned URL → S3 PUT → DynamoDB metadata', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg', width: 100, height: 100, type: 'image' }],
    } as never)

    const presignData = {
      uploadUrl: 'https://s3.example.com/presigned-upload',
      s3Key: 'photos/garden-1/new-photo.jpg',
    }
    const persistedPhoto: IPhoto = {
      id: 'photo-persisted',
      gardenId: 'garden-1',
      localUri: 'file:///data/app/photos/photo_abc.jpg',
      s3Key: 'photos/garden-1/new-photo.jpg',
      takenAt: '2024-03-15T10:00:00.000Z',
    }

    mockApiPost
      .mockResolvedValueOnce({ data: presignData, status: 200 })
      .mockResolvedValueOnce({ data: persistedPhoto, status: 201 })
    mockFetch.mockResolvedValueOnce({ status: 200 })

    const { result } = renderHook(() => usePhotos({ gardenId: 'garden-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    // Verify presigned URL was requested
    expect(mockApiPost).toHaveBeenCalledWith(
      '/photos/presign',
      expect.objectContaining({
        contentType: 'image/jpeg',
        gardenId: 'garden-1',
      })
    )

    // Verify S3 PUT was called with the presigned URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://s3.example.com/presigned-upload',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
      })
    )

    // Verify metadata was persisted
    expect(mockApiPost).toHaveBeenCalledWith(
      '/photos',
      expect.objectContaining({
        s3Key: 'photos/garden-1/new-photo.jpg',
        gardenId: 'garden-1',
      })
    )

    // Photo should be in the list with s3Key set
    const photoWithKey = result.current.photos.find((p) => p.s3Key)
    expect(photoWithKey).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 5. On presigned URL failure, retains local photo with s3Key unset — Req 5.6
  // -------------------------------------------------------------------------
  it('retains local photo with s3Key unset when presigned URL request fails', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg', width: 100, height: 100, type: 'image' }],
    } as never)

    // Presigned URL request fails
    mockApiPost.mockRejectedValueOnce(new Error('Presign request failed'))

    const { result } = renderHook(() => usePhotos({ gardenId: 'garden-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    // Photo should be in the list without s3Key (local-only)
    expect(result.current.photos.length).toBe(1)
    expect(result.current.photos[0].s3Key).toBeUndefined()
    expect(result.current.photos[0].localUri).toBeDefined()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Presign request failed')
  })

  // -------------------------------------------------------------------------
  // 6. On non-200 S3 response, retains local photo with s3Key unset — Req 5.7
  // -------------------------------------------------------------------------
  it('retains local photo with s3Key unset when S3 PUT returns non-200', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg', width: 100, height: 100, type: 'image' }],
    } as never)

    const presignData = {
      uploadUrl: 'https://s3.example.com/presigned-upload',
      s3Key: 'photos/garden-1/new-photo.jpg',
    }
    mockApiPost.mockResolvedValueOnce({ data: presignData, status: 200 })

    // S3 PUT returns 403
    mockFetch.mockResolvedValueOnce({ status: 403 })

    const { result } = renderHook(() => usePhotos({ gardenId: 'garden-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    // Photo should be in the list without s3Key (local-only)
    expect(result.current.photos.length).toBe(1)
    expect(result.current.photos[0].s3Key).toBeUndefined()
    expect(result.current.photos[0].localUri).toBeDefined()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toContain('S3 upload failed')

    // No DynamoDB metadata call should have been made
    expect(mockApiPost).toHaveBeenCalledTimes(1) // Only presign call
  })

  // -------------------------------------------------------------------------
  // 7. deletePhoto removes from list and calls API — Req 5.8
  // -------------------------------------------------------------------------
  it('deletePhoto removes photo from list and calls delete API', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PHOTO_A, PHOTO_B],
      status: 200,
    })
    mockApiDelete.mockResolvedValueOnce({ data: {}, status: 200 })

    const { result } = renderHook(() =>
      usePhotos({ gardenId: 'garden-1', plantId: 'plant-1' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deletePhoto('photo-1')
    })

    expect(mockApiDelete).toHaveBeenCalledWith('/photos/photo-1')
    expect(result.current.photos).not.toContainEqual(PHOTO_A)
    expect(result.current.photos).toContainEqual(PHOTO_B)
  })

  // -------------------------------------------------------------------------
  // 8. Error state is set on API failure — Req 9.3
  // -------------------------------------------------------------------------
  it('sets error state when fetchPhotos API call fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
  })

  it('sets error state when deletePhoto API call fails', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [PHOTO_A],
      status: 200,
    })
    mockApiDelete.mockRejectedValueOnce(new Error('Delete failed'))

    const { result } = renderHook(() =>
      usePhotos({ gardenId: 'garden-1', plantId: 'plant-1' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deletePhoto('photo-1')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Delete failed')
  })

  // -------------------------------------------------------------------------
  // 9. Camera permission denied sets error
  // -------------------------------------------------------------------------
  it('sets error when camera permission is denied', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.DENIED,
      granted: false,
      expires: 'never',
      canAskAgain: true,
    })

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Camera permission not granted')
    expect(mockLaunchCamera).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 10. Media library permission denied sets error
  // -------------------------------------------------------------------------
  it('sets error when media library permission is denied', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestMediaLibraryPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.DENIED,
      granted: false,
      expires: 'never',
      canAskAgain: true,
    })

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.pickFromGallery()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(
      'Media library permission not granted'
    )
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Camera canceled does not add photo
  // -------------------------------------------------------------------------
  it('does not add photo when camera is canceled', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestCameraPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: true,
      assets: [],
    } as never)

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.capturePhoto()
    })

    expect(result.current.photos).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Gallery picker canceled does not add photo
  // -------------------------------------------------------------------------
  it('does not add photo when gallery picker is canceled', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })
    mockRequestMediaLibraryPermissions.mockResolvedValueOnce({
      status: ImagePicker.PermissionStatus.GRANTED,
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })
    mockLaunchImageLibrary.mockResolvedValueOnce({
      canceled: true,
      assets: [],
    } as never)

    const { result } = renderHook(() => usePhotos({ plantId: 'plant-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.pickFromGallery()
    })

    expect(result.current.photos).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })
})
