/**
 * Zod schemas for auth data validation.
 *
 * - `loginFormSchema` validates form submission (Requirement 3.2)
 * - `authSessionSchema` validates persisted session shape on app launch (Requirement 6.4)
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Login form validation
// ---------------------------------------------------------------------------

/**
 * Validates that email and password are non-empty after trimming.
 * Used to reject whitespace-only or empty submissions before calling the provider.
 */
const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().trim().min(1, 'Password is required'),
})

// ---------------------------------------------------------------------------
// Persisted session validation
// ---------------------------------------------------------------------------

/**
 * Validates the shape of a persisted auth session read from MMKV.
 * Detects corrupt or incomplete state so the app can fall back to unauthenticated.
 */
const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
  groups: z.array(z.string()),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

type LoginFormData = z.infer<typeof loginFormSchema>
type AuthSessionData = z.infer<typeof authSessionSchema>

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { authSessionSchema, loginFormSchema }
export type { AuthSessionData, LoginFormData }

