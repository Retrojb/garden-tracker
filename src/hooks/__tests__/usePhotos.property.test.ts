/**
 * Property-Based Tests for usePhotos hook — Photo Upload Atomicity
 *
 * **Property 4: Photo Upload Atomicity** — if presigned URL request fails or
 * S3 PUT returns non-200, no DynamoDB record is created; photo remains
 * local-only with `s3Key` unset.
 *
 * **Validates: Requirements 5.6, 5.7, 9.5**
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
import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import * as fc from 'fast-check'
import { usePhotos } from '../usePhotos'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>
const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>

const mockRequestCameraPermissions =
  ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestCameraPermissionsAsync
  >
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.MockedFunction<
  typeof ImagePicker.launchCameraAsync
>
const mockRequestMediaLibraryPermissions =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestMediaLibraryPermissionsAsync
  >
const mockLaunchImageLibrary =
  ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
    typeof ImagePicker.launchImageLibraryAsync
  >

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.MockedFunction<
  typeof FileSystem.getInfoAsync
>
const mockCopyAsync = FileSystem.copyAsync as jest.MockedFunction<
  typeof FileSystem.copyAsync
>
const mockReadAsStringAsync =
  FileSystem.readAsStringAsync as jest.MockedFunction<
    typeof FileSystem.readAsStringAsync
  >

// Mock global fetch for S3 upload
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock atob for base64 decoding
global.atob = jest.fn((str: string) => str)

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid garden ID (UUID-like string).
 */
const gardenIdArb = fc.uuid()

/**
 * Generates a valid plant ID (UUID-like string).
 */
const plantIdArb = fc.uuid()

/**
 * Generates a valid local file URI.
 */
const localUriArb = fc.stringMatching(/^file:\/\/\/tmp\/photo_[a-z0-9]{4}\.jpg$/)

/**
 * Generates an error message for presigned URL failures.
 */
const presignErrorMessageArb = fc.constantFrom(
  'Network error',
  'Timeout',
  'Internal server error',
  'Unauthorized',
  'Service unavailable',
  'Connection refused',
  'POST /photos/presign failed with status 500',
  'POST /photos/presign failed with status 403'
)

/**
 * Generates a non-200 HTTP status code for S3 PUT failures.
 * Covers common failure codes: 4xx and 5xx.
 */
const nonOkStatusCodeArb = fc.constantFrom(
  400, 401, 403, 404, 408, 413, 429, 500, 502, 503, 504
)

/**
 * Generates a valid presigned URL.
 */
const presignedUrlArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{8}$/),
    fc.stringMatching(/^[a-z0-9]{6}$/)
  )
  .map(([bucket, key]) => `https://${bucket}.s3.amazonaws.com/${key}`)

/**
 * Generates a valid S3 key.
 */
const s3KeyArb = fc
  .tuple(gardenIdArb, fc.stringMatching(/^[a-z0-9]{8}$/))
  .map(([id, name]) => `photos/${id}/${name}.jpg`)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sets up common mocks for a photo capture flow (camera path).
 * Returns the local URI that will be "captured".
 */
const setupCameraCaptureMocks = (sourceUri: string): void => {
  mockRequestCameraPermissions.mockResolvedValueOnce({
    status: ImagePicker.PermissionStatus.GRANTED,
    granted: true,
    expires: 'never',
    canAskAgain: true,
  })
  mockLaunchCamera.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri: sourceUri, width: 100, height: 100, type: 'image' }],
  } as never)
}

/**
 * Sets up common mocks for a photo pick from gallery flow.
 */
const setupGalleryPickMocks = (sourceUri: string): void => {
  mockRequestMediaLibraryPermissions.mockResolvedValueOnce({
    status: ImagePicker.PermissionStatus.GRANTED,
    granted: true,
    expires: 'never',
    canAskAgain: true,
  })
  mockLaunchImageLibrary.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri: sourceUri, width: 100, height: 100, type: 'image' }],
  } as never)
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
  mockCopyAsync.mockResolvedValue(undefined as never)
  mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')
  mockFetch.mockResolvedValue({ status: 200 })
})

// ---------------------------------------------------------------------------
// Property 4: Photo Upload Atomicity
// ---------------------------------------------------------------------------

describe('Property 4: Photo Upload Atomicity', () => {
  /**
   * Sub-property A: When presigned URL request fails, no DynamoDB metadata
   * record is created and the photo remains local-only with `s3Key` unset.
   *
   * For any valid gardenId, plantId, and any error thrown by the presign
   * endpoint, the hook must:
   *  - NOT call apiClient.post('/photos', ...) to persist metadata
   *  - Retain the photo in the photos list with `s3Key` undefined
   *  - Set the `error` state
   *
   * **Validates: Requirements 5.6, 9.5**
   */
  it('no DynamoDB record is created when presigned URL request fails (camera path)', async () => {
    await fc.assert(
      fc.asyncProperty(
        gardenIdArb,
        plantIdArb,
        localUriArb,
        presignErrorMessageArb,
        async (gardenId, plantId, sourceUri, errorMessage) => {
          jest.clearAllMocks()
          mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
          mockCopyAsync.mockResolvedValue(undefined as never)
          mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')

          // Initial fetch returns empty photos list
          mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })

          // Set up camera capture mocks
          setupCameraCaptureMocks(sourceUri)

          // Presigned URL request fails
          mockApiPost.mockRejectedValueOnce(new Error(errorMessage))

          const { result, unmount } = renderHook(() =>
            usePhotos({ gardenId, plantId })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          await act(async () => {
            await result.current.capturePhoto()
          })

          // apiClient.post should have been called exactly once (the presign
          // attempt that failed). No second call for metadata persistence.
          expect(mockApiPost).toHaveBeenCalledTimes(1)
          expect(mockApiPost).toHaveBeenCalledWith(
            '/photos/presign',
            expect.objectContaining({
              contentType: 'image/jpeg',
              gardenId,
              plantId,
            })
          )

          // Photo remains in the list with s3Key unset (local-only)
          expect(result.current.photos.length).toBe(1)
          expect(result.current.photos[0].s3Key).toBeUndefined()
          expect(result.current.photos[0].localUri).toBeDefined()

          // Error state is set
          expect(result.current.error).toBeInstanceOf(Error)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Sub-property B: When S3 PUT returns a non-200 status code, no DynamoDB
   * metadata record is created and the photo remains local-only with `s3Key`
   * unset.
   *
   * For any valid gardenId, plantId, any valid presigned URL/s3Key, and any
   * non-200 HTTP status code from S3, the hook must:
   *  - NOT call apiClient.post('/photos', ...) to persist metadata
   *  - Retain the photo in the photos list with `s3Key` undefined
   *  - Set the `error` state
   *
   * **Validates: Requirements 5.7, 9.5**
   */
  it('no DynamoDB record is created when S3 PUT returns non-200 (camera path)', async () => {
    await fc.assert(
      fc.asyncProperty(
        gardenIdArb,
        plantIdArb,
        localUriArb,
        presignedUrlArb,
        s3KeyArb,
        nonOkStatusCodeArb,
        async (gardenId, plantId, sourceUri, uploadUrl, s3Key, statusCode) => {
          jest.clearAllMocks()
          mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
          mockCopyAsync.mockResolvedValue(undefined as never)
          mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')

          // Initial fetch returns empty photos list
          mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })

          // Set up camera capture mocks
          setupCameraCaptureMocks(sourceUri)

          // Presigned URL request succeeds
          mockApiPost.mockResolvedValueOnce({
            data: { uploadUrl, s3Key },
            status: 200,
          })

          // S3 PUT returns non-200 status
          mockFetch.mockResolvedValueOnce({ status: statusCode })

          const { result, unmount } = renderHook(() =>
            usePhotos({ gardenId, plantId })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          await act(async () => {
            await result.current.capturePhoto()
          })

          // apiClient.post should have been called exactly once (presign only).
          // No second call for metadata persistence to DynamoDB.
          expect(mockApiPost).toHaveBeenCalledTimes(1)
          expect(mockApiPost).toHaveBeenCalledWith(
            '/photos/presign',
            expect.objectContaining({
              contentType: 'image/jpeg',
              gardenId,
              plantId,
            })
          )

          // Photo remains in the list with s3Key unset (local-only)
          expect(result.current.photos.length).toBe(1)
          expect(result.current.photos[0].s3Key).toBeUndefined()
          expect(result.current.photos[0].localUri).toBeDefined()

          // Error state is set
          expect(result.current.error).toBeInstanceOf(Error)
          expect(result.current.error?.message).toContain('S3 upload failed')

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Sub-property C: When presigned URL request fails via gallery path, no
   * DynamoDB metadata record is created and the photo remains local-only.
   *
   * This verifies the same atomicity property holds regardless of the photo
   * source (gallery vs camera).
   *
   * **Validates: Requirements 5.6, 9.5**
   */
  it('no DynamoDB record is created when presigned URL request fails (gallery path)', async () => {
    await fc.assert(
      fc.asyncProperty(
        gardenIdArb,
        plantIdArb,
        localUriArb,
        presignErrorMessageArb,
        async (gardenId, plantId, sourceUri, errorMessage) => {
          jest.clearAllMocks()
          mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
          mockCopyAsync.mockResolvedValue(undefined as never)
          mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')

          // Initial fetch returns empty photos list
          mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })

          // Set up gallery pick mocks
          setupGalleryPickMocks(sourceUri)

          // Presigned URL request fails
          mockApiPost.mockRejectedValueOnce(new Error(errorMessage))

          const { result, unmount } = renderHook(() =>
            usePhotos({ gardenId, plantId })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          await act(async () => {
            await result.current.pickFromGallery()
          })

          // Only the presign call was made — no metadata persistence
          expect(mockApiPost).toHaveBeenCalledTimes(1)
          expect(mockApiPost).toHaveBeenCalledWith(
            '/photos/presign',
            expect.objectContaining({
              contentType: 'image/jpeg',
              gardenId,
              plantId,
            })
          )

          // Photo remains local-only with s3Key unset
          expect(result.current.photos.length).toBe(1)
          expect(result.current.photos[0].s3Key).toBeUndefined()
          expect(result.current.photos[0].localUri).toBeDefined()

          // Error state is set
          expect(result.current.error).toBeInstanceOf(Error)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Sub-property D: When S3 PUT returns non-200 via gallery path, no DynamoDB
   * metadata record is created and the photo remains local-only.
   *
   * **Validates: Requirements 5.7, 9.5**
   */
  it('no DynamoDB record is created when S3 PUT returns non-200 (gallery path)', async () => {
    await fc.assert(
      fc.asyncProperty(
        gardenIdArb,
        plantIdArb,
        localUriArb,
        presignedUrlArb,
        s3KeyArb,
        nonOkStatusCodeArb,
        async (gardenId, plantId, sourceUri, uploadUrl, s3Key, statusCode) => {
          jest.clearAllMocks()
          mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true } as never)
          mockCopyAsync.mockResolvedValue(undefined as never)
          mockReadAsStringAsync.mockResolvedValue('base64encodedcontent')

          // Initial fetch returns empty photos list
          mockApiGet.mockResolvedValueOnce({ data: [], status: 200 })

          // Set up gallery pick mocks
          setupGalleryPickMocks(sourceUri)

          // Presigned URL request succeeds
          mockApiPost.mockResolvedValueOnce({
            data: { uploadUrl, s3Key },
            status: 200,
          })

          // S3 PUT returns non-200 status
          mockFetch.mockResolvedValueOnce({ status: statusCode })

          const { result, unmount } = renderHook(() =>
            usePhotos({ gardenId, plantId })
          )

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })

          await act(async () => {
            await result.current.pickFromGallery()
          })

          // Only the presign call was made — no metadata persistence
          expect(mockApiPost).toHaveBeenCalledTimes(1)
          expect(mockApiPost).toHaveBeenCalledWith(
            '/photos/presign',
            expect.objectContaining({
              contentType: 'image/jpeg',
              gardenId,
              plantId,
            })
          )

          // Photo remains local-only with s3Key unset
          expect(result.current.photos.length).toBe(1)
          expect(result.current.photos[0].s3Key).toBeUndefined()
          expect(result.current.photos[0].localUri).toBeDefined()

          // Error state is set
          expect(result.current.error).toBeInstanceOf(Error)
          expect(result.current.error?.message).toContain('S3 upload failed')

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })
})
