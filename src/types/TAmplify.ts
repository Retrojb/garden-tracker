/**
 * Types for AWS Amplify configuration and API client.
 */

/** Amplify resource configuration derived from EAS secrets / env vars. */
interface IAmplifyConfig {
  Auth: {
    Cognito: {
      userPoolId: string
      userPoolClientId: string
      identityPoolId?: string
    }
  }
  API: {
    REST: Record<
      string,
      {
        endpoint: string
        region: string
      }
    >
  }
}

/** HTTP methods supported by the typed API client. */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Options for an API request. */
interface IApiRequestOptions {
  /** Request body (serialized to JSON for POST/PUT). */
  body?: unknown
  /** Additional headers to merge with defaults. */
  headers?: Record<string, string>
  /** Query parameters appended to the URL. */
  queryParams?: Record<string, string>
}

export type { HttpMethod, IAmplifyConfig, IApiRequestOptions }

