/**
 * Zod schemas for runtime API payload validation.
 *
 * Each schema mirrors the corresponding TypeScript interface in `src/types/index.ts`
 * and enforces the field constraints documented in the design and requirements.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string — non-empty, basic format check */
const isoDateTimeSchema = z
  .string()
  .min(1)
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Must be a valid ISO 8601 datetime string',
  })

/** ISO 8601 date-only string (YYYY-MM-DD) */
const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Must be a valid ISO 8601 date string (YYYY-MM-DD)'
  )

/** UUID v4 string */
const uuidSchema = z.string().uuid('Must be a valid UUID')

// ---------------------------------------------------------------------------
// Plant schema
// ---------------------------------------------------------------------------

/**
 * Runtime schema for a {@link Plant} record.
 *
 * Validation rules:
 * - `name`    : required, 1–100 characters (trimmed)
 * - `species` : required, 1–100 characters (trimmed)
 * - `variety` : optional, max 100 characters
 */
const plantSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  species: z
    .string()
    .trim()
    .min(1, 'Species is required')
    .max(100, 'Species must be 100 characters or fewer'),
  variety: z
    .string()
    .max(100, 'Variety must be 100 characters or fewer')
    .optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

// ---------------------------------------------------------------------------
// Garden schema
// ---------------------------------------------------------------------------

/** Valid garden type values */
const gardenTypeSchema = z.enum([
  'raised_bed',
  'in_ground',
  'container',
  'greenhouse',
  'other',
])

/**
 * Runtime schema for {@link GardenDimensions}.
 *
 * Validation rules:
 * - `widthInches`  : positive integer, max 1200
 * - `heightInches` : positive integer, max 1200
 * - `lengthInches` : positive integer, max 1200
 */
const gardenDimensionsSchema = z.object({
  widthInches: z
    .number()
    .int('Width must be an integer')
    .min(1, 'Width must be greater than 0')
    .max(1200, 'Width must be 1200 inches or fewer'),
  heightInches: z
    .number()
    .int('Height must be an integer')
    .min(1, 'Height must be greater than 0')
    .max(1200, 'Height must be 1200 inches or fewer'),
  lengthInches: z
    .number()
    .int('Length must be an integer')
    .min(1, 'Length must be greater than 0')
    .max(1200, 'Length must be 1200 inches or fewer'),
})

/**
 * Runtime schema for a {@link Garden} record.
 *
 * Validation rules:
 * - `name`       : required, 1–100 characters
 * - `type`       : must be a valid {@link GardenType}
 * - `dimensions` : see {@link gardenDimensionsSchema}
 */
const gardenSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  type: gardenTypeSchema,
  size: z.string().min(1),
  dimensions: gardenDimensionsSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

// ---------------------------------------------------------------------------
// CalendarEvent schema
// ---------------------------------------------------------------------------

/** Valid calendar event type values */
const eventTypeSchema = z.enum([
  'planted',
  'fertilized',
  'harvested',
  'watered',
  'pruned',
  'custom',
])

/**
 * Runtime schema for a {@link CalendarEvent} record.
 *
 * Validation rules:
 * - `plantId`   : required UUID
 * - `eventType` : must be a valid {@link EventType}
 * - `date`      : ISO 8601 date-only string (YYYY-MM-DD)
 * - `notes`     : optional string
 */
const calendarEventSchema = z.object({
  id: uuidSchema,
  plantId: uuidSchema,
  gardenId: uuidSchema.optional(),
  eventType: eventTypeSchema,
  date: isoDateSchema,
  notes: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

// ---------------------------------------------------------------------------
// Photo schema
// ---------------------------------------------------------------------------

/**
 * Runtime schema for a {@link Photo} record.
 *
 * Validation rules:
 * - `localUri` : required, must start with "file://"
 * - `takenAt`  : ISO 8601 datetime string
 * - `s3Key`    : optional, set after successful S3 upload
 * - `caption`  : optional string
 */
const photoSchema = z.object({
  id: uuidSchema,
  gardenId: uuidSchema.optional(),
  plantId: uuidSchema.optional(),
  localUri: z
    .string()
    .min(1, 'Local URI is required')
    .refine((val) => val.startsWith('file://'), {
      message: 'Local URI must start with "file://"',
    }),
  s3Key: z.string().min(1).optional(),
  takenAt: isoDateTimeSchema,
  caption: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  calendarEventSchema,
  eventTypeSchema,
  gardenDimensionsSchema,
  gardenSchema,
  gardenTypeSchema,
  photoSchema,
  plantSchema
}

