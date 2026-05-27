/**
 * Types for the auth provider abstraction layer.
 * Defines the contract for authentication operations, enabling
 * provider swap (e.g., PlaceholderProvider → CognitoProvider)
 * without modifying consuming components.
 */

/** Represents the current authentication session. */
interface IAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (seconds)
  groups: string[]; // IAM group memberships
}

/** Credentials required for sign-in. */
interface ISignInCredentials {
  email: string;
  password: string;
}

/** Contract for authentication provider implementations. */
interface IAuthProvider {
  signIn: (credentials: ISignInCredentials) => Promise<IAuthSession>;
  signOut: () => Promise<void>;
  getSession: () => Promise<IAuthSession | null>;
  refreshSession: () => Promise<IAuthSession>;
}

export type { IAuthProvider, IAuthSession, ISignInCredentials };
