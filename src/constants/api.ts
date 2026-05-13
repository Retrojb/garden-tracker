/**
 * API endpoint constants and base URL configuration.
 *
 * The base URL is read from the EAS / Expo environment variable
 * `EXPO_PUBLIC_API_BASE_URL`. Set this in your `.env.local` or as an
 * EAS secret before building.
 *
 * Example .env.local:
 *   EXPO_PUBLIC_API_BASE_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
 */

/** Root URL for the API Gateway stage. Defaults to a placeholder. */
export const API_BASE_URL: string =
  process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'https://api.example.com'

/** API route paths */
export const API_ROUTES = {
  /** Garden CRUD — GET /gardens, POST /gardens, PUT /gardens/:id, DELETE /gardens/:id */
  GARDENS: '/gardens',

  /** Plant CRUD — GET /plants, POST /plants, PUT /plants/:id, DELETE /plants/:id */
  PLANTS: '/plants',

  /** Calendar event CRUD — GET /calendar, POST /calendar, PUT /calendar/:id, DELETE /calendar/:id */
  CALENDAR: '/calendar',

  /** Photo metadata CRUD — GET /photos, POST /photos, DELETE /photos/:id */
  PHOTOS: '/photos',

  /** Request a presigned S3 upload URL — POST /photos/presign */
  PHOTOS_PRESIGN: '/photos/presign',

  /** Weather proxy — GET /weather?zip=XXXXX or GET /weather?lat=X&lon=Y */
  WEATHER: '/weather',
} as const

/** Helper to build a full URL from a route path */
export function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
