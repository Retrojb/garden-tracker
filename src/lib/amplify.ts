/**
 * AWS Amplify initialization and configuration.
 *
 * Configures Amplify with Cognito User Pool and API Gateway endpoint
 * sourced from EAS secrets / Expo environment variables.
 *
 * Environment variables required:
 *   EXPO_PUBLIC_COGNITO_USER_POOL_ID
 *   EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
 *   EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID (optional)
 *   EXPO_PUBLIC_API_BASE_URL
 *   EXPO_PUBLIC_AWS_REGION
 */

import { Amplify } from 'aws-amplify'
import {
    signOut as amplifySignOut,
    fetchAuthSession,
} from 'aws-amplify/auth'

import type { IAmplifyConfig } from '@/src/types/TAmplify'

// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------

const USER_POOL_ID =
  process.env['EXPO_PUBLIC_COGNITO_USER_POOL_ID'] ?? ''
const USER_POOL_CLIENT_ID =
  process.env['EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID'] ?? ''
const IDENTITY_POOL_ID =
  process.env['EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID'] ?? ''
const API_ENDPOINT =
  process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'https://api.example.com'
const AWS_REGION =
  process.env['EXPO_PUBLIC_AWS_REGION'] ?? 'us-east-1'

// ---------------------------------------------------------------------------
// Build Amplify resource config
// ---------------------------------------------------------------------------

const amplifyConfig: IAmplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: USER_POOL_ID,
      userPoolClientId: USER_POOL_CLIENT_ID,
      ...(IDENTITY_POOL_ID ? { identityPoolId: IDENTITY_POOL_ID } : {}),
    },
  },
  API: {
    REST: {
      GardenTrackerAPI: {
        endpoint: API_ENDPOINT,
        region: AWS_REGION,
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Initialize Amplify
// ---------------------------------------------------------------------------

const configureAmplify = (): void => {
  Amplify.configure({
    Auth: {
      Cognito: amplifyConfig.Auth.Cognito,
    },
  })
}

// Run configuration on module load
configureAmplify()

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves the current Cognito JWT access token.
 * Amplify automatically refreshes the token if expired.
 *
 * @returns The JWT token string, or null if the user is not authenticated.
 */
const getAccessToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? null
    return token
  } catch {
    return null
  }
}

/**
 * Signs the user out and clears Amplify session state.
 * Callers should also clear local caches (MMKV, SQLite) separately.
 */
const signOut = async (): Promise<void> => {
  await amplifySignOut()
}

export {
    amplifyConfig, API_ENDPOINT,
    AWS_REGION, configureAmplify,
    getAccessToken,
    signOut
}

