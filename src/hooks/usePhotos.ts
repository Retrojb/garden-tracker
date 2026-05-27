/**
 * usePhotos hook
 *
 * Manages photo capture, gallery selection, upload to S3, and metadata
 * persistence to DynamoDB. Photos are scoped to a garden or plant via the
 * `context` parameter.
 *
 * Upload algorithm (from design):
 *  1. Request presigned URL from API via `apiClient.post('/photos/presign', ...)`
 *  2. Upload binary to S3 via PUT to the presigned URL
 *  3. On success, persist metadata via `apiClient.post('/photos', ...)`
 *  4. On presigned URL failure or non-200 S3 response, retain local photo
 *     with `s3Key` unset and set `error` state
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useRef, useState } from 'react'

import { API_ROUTES } from '@/src/constants/api'
import { apiClient } from '@/src/lib/apiClient'
import type { IPhoto } from '@/src/types/TPhoto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsePhotosContext {
  gardenId?: string
  plantId?: string
}

export interface UsePhotosResult {
  photos: IPhoto[]
  isLoading: boolean
  error: Error | null
  capturePhoto: () => Promise<void>
  pickFromGallery: () => Promise<void>
  deletePhoto: (photoId: string) => Promise<void>
}

interface PresignResponse {
  uploadUrl: string
  s3Key: string
}

// ---------------------------------------------------------------------------
// UUID helper
// ---------------------------------------------------------------------------

const generateId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const usePhotos = (context: UsePhotosContext): UsePhotosResult => {
  const { gardenId, plantId } = context

  const [photos, setPhotos] = useState<IPhoto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // -------------------------------------------------------------------------
  // Fetch photos for the given context
  // -------------------------------------------------------------------------

  const fetchPhotos = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams: Record<string, string> = {}
      if (gardenId) queryParams['gardenId'] = gardenId
      if (plantId) queryParams['plantId'] = plantId

      const response = await apiClient.get<IPhoto[]>(API_ROUTES.PHOTOS, {
        queryParams,
      })

      if (mountedRef.current) {
        setPhotos(response.data)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [gardenId, plantId])

  useEffect(() => {
    void fetchPhotos()
  }, [fetchPhotos])

  // -------------------------------------------------------------------------
  // Store photo locally using expo-file-system
  // -------------------------------------------------------------------------

  const storeLocally = async (sourceUri: string): Promise<string> => {
    const filename = `photo_${generateId()}.jpg`
    const destUri = `${FileSystem.documentDirectory}photos/${filename}`

    // Ensure the photos directory exists
    const dirInfo = await FileSystem.getInfoAsync(
      `${FileSystem.documentDirectory}photos`
    )
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}photos`,
        { intermediates: true }
      )
    }

    await FileSystem.copyAsync({ from: sourceUri, to: destUri })
    return destUri
  }

  // -------------------------------------------------------------------------
  // Upload flow: presigned URL → S3 PUT → persist metadata
  // -------------------------------------------------------------------------

  const uploadPhoto = async (localUri: string): Promise<IPhoto> => {
    const photoId = generateId()
    const takenAt = new Date().toISOString()

    // Create local-only photo record first (Req 5.3)
    const localPhoto: IPhoto = {
      id: photoId,
      gardenId,
      plantId,
      localUri,
      takenAt,
    }

    // Optimistically add to the list
    if (mountedRef.current) {
      setPhotos((prev) => [...prev, localPhoto])
    }

    try {
      // Step 1: Request presigned URL (Req 5.4)
      const presignResponse = await apiClient.post<PresignResponse>(
        API_ROUTES.PHOTOS_PRESIGN,
        {
          contentType: 'image/jpeg',
          gardenId,
          plantId,
        }
      )

      const { uploadUrl, s3Key } = presignResponse.data

      // Step 2: Upload binary to S3 via PUT
      const fileContent = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const binaryString = atob(fileContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: bytes,
        headers: { 'Content-Type': 'image/jpeg' },
      })

      if (uploadResult.status !== 200) {
        // Req 5.7: non-200 S3 response — retain local, no DynamoDB record
        throw new Error(
          `S3 upload failed with status ${uploadResult.status}`
        )
      }

      // Step 3: Persist metadata to DynamoDB (Req 5.5)
      const metadataResponse = await apiClient.post<IPhoto>(
        API_ROUTES.PHOTOS,
        {
          id: photoId,
          s3Key,
          localUri,
          gardenId,
          plantId,
          takenAt,
        }
      )

      const persistedPhoto = metadataResponse.data

      // Update the photo in the list with the s3Key
      if (mountedRef.current) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? persistedPhoto : p))
        )
      }

      return persistedPhoto
    } catch (err) {
      // Req 5.6 / 5.7: On failure, retain local photo with s3Key unset
      // The photo is already in the list without s3Key from the optimistic add
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
      return localPhoto
    }
  }

  // -------------------------------------------------------------------------
  // capturePhoto — open camera via expo-image-picker (Req 5.1)
  // -------------------------------------------------------------------------

  const capturePhoto = useCallback(async (): Promise<void> => {
    setError(null)

    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        throw new Error('Camera permission not granted')
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const sourceUri = result.assets[0].uri

      // Store locally (Req 5.3)
      const localUri = await storeLocally(sourceUri)

      // Upload flow
      await uploadPhoto(localUri)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [gardenId, plantId])

  // -------------------------------------------------------------------------
  // pickFromGallery — open gallery via expo-image-picker (Req 5.2)
  // -------------------------------------------------------------------------

  const pickFromGallery = useCallback(async (): Promise<void> => {
    setError(null)

    try {
      // Request media library permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        throw new Error('Media library permission not granted')
      }

      // Open gallery picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const sourceUri = result.assets[0].uri

      // Store locally (Req 5.3)
      const localUri = await storeLocally(sourceUri)

      // Upload flow
      await uploadPhoto(localUri)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [gardenId, plantId])

  // -------------------------------------------------------------------------
  // deletePhoto — remove from list, S3, and DynamoDB (Req 5.8)
  // -------------------------------------------------------------------------

  const deletePhoto = useCallback(
    async (photoId: string): Promise<void> => {
      setError(null)

      try {
        // Remove from local state immediately
        if (mountedRef.current) {
          setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        }

        // Delete from API (handles S3 object deletion + DynamoDB record)
        await apiClient.delete(`${API_ROUTES.PHOTOS}/${photoId}`)
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    },
    []
  )

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    photos,
    isLoading,
    error,
    capturePhoto,
    pickFromGallery,
    deletePhoto,
  }
}

export { usePhotos }
