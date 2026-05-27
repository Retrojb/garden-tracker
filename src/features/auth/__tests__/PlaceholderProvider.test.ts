/**
 * Unit tests for PlaceholderProvider
 *
 * Validates that the placeholder auth provider correctly implements
 * the IAuthProvider interface with static dummy session data.
 *
 * Validates: Requirements 8.7
 */

import { PlaceholderProvider } from '../PlaceholderProvider';

describe('PlaceholderProvider', () => {
  describe('signIn', () => {
    it('returns a valid IAuthSession shape', async () => {
      const session = await PlaceholderProvider.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(session).toHaveProperty('accessToken');
      expect(session).toHaveProperty('refreshToken');
      expect(session).toHaveProperty('expiresAt');
      expect(session).toHaveProperty('groups');
    });

    it('returns accessToken as a non-empty string', async () => {
      const session = await PlaceholderProvider.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(typeof session.accessToken).toBe('string');
      expect(session.accessToken.length).toBeGreaterThan(0);
      expect(session.accessToken).toBe('placeholder-access-token');
    });

    it('returns refreshToken as a non-empty string', async () => {
      const session = await PlaceholderProvider.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(typeof session.refreshToken).toBe('string');
      expect(session.refreshToken.length).toBeGreaterThan(0);
      expect(session.refreshToken).toBe('placeholder-refresh-token');
    });

    it('returns expiresAt approximately 1 hour in the future', async () => {
      const before = Math.floor(Date.now() / 1000) + 3600;
      const session = await PlaceholderProvider.signIn({
        email: 'test@example.com',
        password: 'password123',
      });
      const after = Math.floor(Date.now() / 1000) + 3600;

      expect(session.expiresAt).toBeGreaterThanOrEqual(before);
      expect(session.expiresAt).toBeLessThanOrEqual(after);
    });

    it('returns an empty groups array', async () => {
      const session = await PlaceholderProvider.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(Array.isArray(session.groups)).toBe(true);
      expect(session.groups).toHaveLength(0);
    });
  });

  describe('signOut', () => {
    it('resolves without error', async () => {
      await expect(PlaceholderProvider.signOut()).resolves.toBeUndefined();
    });
  });

  describe('getSession', () => {
    it('returns null', async () => {
      const session = await PlaceholderProvider.getSession();

      expect(session).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('returns a valid IAuthSession shape', async () => {
      const session = await PlaceholderProvider.refreshSession();

      expect(session).toHaveProperty('accessToken');
      expect(session).toHaveProperty('refreshToken');
      expect(session).toHaveProperty('expiresAt');
      expect(session).toHaveProperty('groups');
    });

    it('returns a refreshed accessToken distinct from signIn token', async () => {
      const session = await PlaceholderProvider.refreshSession();

      expect(typeof session.accessToken).toBe('string');
      expect(session.accessToken.length).toBeGreaterThan(0);
      expect(session.accessToken).toBe('placeholder-access-token-refreshed');
    });

    it('returns the same refreshToken as signIn', async () => {
      const session = await PlaceholderProvider.refreshSession();

      expect(session.refreshToken).toBe('placeholder-refresh-token');
    });

    it('returns expiresAt approximately 1 hour in the future', async () => {
      const before = Math.floor(Date.now() / 1000) + 3600;
      const session = await PlaceholderProvider.refreshSession();
      const after = Math.floor(Date.now() / 1000) + 3600;

      expect(session.expiresAt).toBeGreaterThanOrEqual(before);
      expect(session.expiresAt).toBeLessThanOrEqual(after);
    });

    it('returns an empty groups array', async () => {
      const session = await PlaceholderProvider.refreshSession();

      expect(Array.isArray(session.groups)).toBe(true);
      expect(session.groups).toHaveLength(0);
    });
  });
});
