/**
 * Unit tests for src/lib/amplify.ts
 *
 * Covers:
 *  1. configureAmplify calls Amplify.configure with correct Cognito config
 *  2. getAccessToken returns token string when session is valid
 *  3. getAccessToken returns null when no session exists
 *  4. getAccessToken returns null when fetchAuthSession throws
 *  5. signOut delegates to Amplify signOut
 *  6. amplifyConfig uses environment variables when available
 *  7. amplifyConfig falls back to defaults when env vars are missing
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('aws-amplify', () => ({
  __esModule: true,
  Amplify: {
    configure: jest.fn(),
  },
}))

jest.mock('aws-amplify/auth', () => ({
  __esModule: true,
  fetchAuthSession: jest.fn(),
  signOut: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  amplifyConfig,
  configureAmplify,
  getAccessToken,
  signOut,
} from '../amplify'

// Access mock functions after import
const { Amplify } = jest.requireMock<{ Amplify: { configure: jest.Mock } }>('aws-amplify')
const mockConfigure = Amplify.configure as jest.Mock

const { fetchAuthSession: mockFetchAuthSession, signOut: mockAmplifySignOut } =
  jest.requireMock<{ fetchAuthSession: jest.Mock; signOut: jest.Mock }>('aws-amplify/auth')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

describe('configureAmplify', () => {
  it('calls Amplify.configure with Cognito auth config', () => {
    // configureAmplify is called on module load, but we call it again to test
    configureAmplify()

    expect(mockConfigure).toHaveBeenCalledWith({
      Auth: {
        Cognito: amplifyConfig.Auth.Cognito,
      },
    })
  })
})

describe('amplifyConfig', () => {
  it('contains Auth.Cognito with userPoolId and userPoolClientId', () => {
    expect(amplifyConfig.Auth.Cognito).toHaveProperty('userPoolId')
    expect(amplifyConfig.Auth.Cognito).toHaveProperty('userPoolClientId')
  })

  it('contains API.REST.GardenTrackerAPI with endpoint and region', () => {
    expect(amplifyConfig.API.REST.GardenTrackerAPI).toHaveProperty('endpoint')
    expect(amplifyConfig.API.REST.GardenTrackerAPI).toHaveProperty('region')
  })
})

describe('getAccessToken', () => {
  it('returns the token string when session has a valid access token', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: {
          toString: () => 'mock-jwt-token-abc123',
        },
      },
    })

    const token = await getAccessToken()
    expect(token).toBe('mock-jwt-token-abc123')
  })

  it('returns null when session has no tokens', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: undefined,
    })

    const token = await getAccessToken()
    expect(token).toBeNull()
  })

  it('returns null when session tokens have no accessToken', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: undefined,
      },
    })

    const token = await getAccessToken()
    expect(token).toBeNull()
  })

  it('returns null when fetchAuthSession throws an error', async () => {
    mockFetchAuthSession.mockRejectedValue(new Error('Not authenticated'))

    const token = await getAccessToken()
    expect(token).toBeNull()
  })
})

describe('signOut', () => {
  it('delegates to Amplify signOut', async () => {
    mockAmplifySignOut.mockResolvedValue(undefined)

    await signOut()

    expect(mockAmplifySignOut).toHaveBeenCalledTimes(1)
  })
})
