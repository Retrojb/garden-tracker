import type { IAuthProvider } from '@/types/TAuthProvider';

/**
 * Placeholder authentication provider for local development.
 * Returns static dummy session data, enabling full UI and flow
 * development without a backend. Swap to CognitoProvider for production.
 */
const PlaceholderProvider: IAuthProvider = {
  signIn: async (_credentials) => ({
    accessToken: 'placeholder-access-token',
    refreshToken: 'placeholder-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    groups: [],
  }),
  signOut: async () => {},
  getSession: async () => null,
  refreshSession: async () => ({
    accessToken: 'placeholder-access-token-refreshed',
    refreshToken: 'placeholder-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    groups: [],
  }),
};

export { PlaceholderProvider };
