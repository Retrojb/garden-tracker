// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------

interface IPhoto {
  /** UUID */
  id: string
  /** Associated garden */
  gardenId?: string
  /** Associated plant */
  plantId?: string
  /** Local file URI (expo-file-system) */
  localUri: string
  /** S3 object key after upload */
  s3Key?: string
  /** ISO 8601 timestamp when photo was taken */
  takenAt: string
  /** Optional caption */
  caption?: string
}

export type { IPhoto }
