/**
 * Client-side validation utilities
 */
import type { ICreateGardenPayload } from '@/src/types/TPayload'
import type { IPlant } from '@/src/types/TPlant'
import type { IValidationResult } from '@/src/types/TValidation'

// ---------------------------------------------------------------------------
// Plant validation
// ---------------------------------------------------------------------------

/**
 * Validates a partial Plant input against the field constraints defined in the
 * data model:
 *  - `name`    : required, 1–100 characters (trimmed)
 *  - `species` : required, 1–100 characters (trimmed)
 *  - `variety` : optional, max 100 characters (not trimmed for length check)
 *
 * The function never mutates its input.
 *
 * @param input - A partial Plant object supplied by the user
 * @returns A {@link IValidationResult} indicating whether the input is valid
 */
const validatePlant = (input: Partial<IPlant>): IValidationResult => {
  const errors: Array<{ field: string; message: string }> = []

  // --- name ---
  if (input.name == null || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (input.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'Name must be 100 characters or fewer',
    })
  }

  // --- species ---
  if (input.species == null || input.species.trim().length === 0) {
    errors.push({ field: 'species', message: 'Species is required' })
  } else if (input.species.trim().length > 100) {
    errors.push({
      field: 'species',
      message: 'Species must be 100 characters or fewer',
    })
  }

  // --- variety (optional) ---
  if (input.variety != null && input.variety.length > 100) {
    errors.push({
      field: 'variety',
      message: 'Variety must be 100 characters or fewer',
    })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

// ---------------------------------------------------------------------------
// Garden validation
// ---------------------------------------------------------------------------

const VALID_GARDEN_TYPES = [
  'raised_bed',
  'in_ground',
  'container',
  'greenhouse',
  'other',
] as const

/**
 * Validates a garden creation payload against the field constraints defined in
 * the data model:
 *  - `name`                     : required, 1–100 characters (trimmed)
 *  - `type`                     : required, must be a valid TGardenType
 *  - `dimensions.widthInches`   : required, positive integer, max 1200
 *  - `dimensions.heightInches`  : required, positive integer, max 1200
 *
 * The function never mutates its input.
 *
 * @param input - A partial garden payload supplied by the user
 * @returns A {@link IValidationResult} indicating whether the input is valid
 */
const validateGarden = (
  input: Partial<ICreateGardenPayload>
): IValidationResult => {
  const errors: Array<{ field: string; message: string }> = []

  // --- name ---
  if (input.name == null || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (input.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'Name must be 100 characters or fewer',
    })
  }

  // --- type ---
  if (
    input.type == null ||
    !(VALID_GARDEN_TYPES as readonly string[]).includes(input.type)
  ) {
    errors.push({ field: 'type', message: 'A valid garden type is required' })
  }

  // --- dimensions.widthInches ---
  const w = input.dimensions?.widthInches
  if (w == null || !Number.isInteger(w) || w <= 0 || w > 1200) {
    errors.push({
      field: 'dimensions.widthInches',
      message: 'Width must be a whole number between 1 and 1200 inches',
    })
  }

  // --- dimensions.heightInches ---
  const h = input.dimensions?.heightInches
  if (h == null || !Number.isInteger(h) || h <= 0 || h > 1200) {
    errors.push({
      field: 'dimensions.heightInches',
      message: 'Height must be a whole number between 1 and 1200 inches',
    })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

export { validateGarden, validatePlant }
