// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface IValidationResult {
  /** Whether the input is valid */
  valid: boolean
  /** List of field-level validation errors */
  errors: Array<{ field: string; message: string }>
}

export type { IValidationResult }
