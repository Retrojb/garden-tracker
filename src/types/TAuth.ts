/**
 * Types for the authentication module (src/lib/auth.ts).
 */

/** Events emitted by the auth event system. */
type AuthEventType = 'TOKEN_REFRESH_FAILED' | 'SIGNED_OUT'

/** Payload for auth events. */
interface IAuthEvent {
  type: AuthEventType
  /** Optional error that triggered the event. */
  error?: Error
}

/** Listener callback for auth events. */
type AuthEventListener = (event: IAuthEvent) => void

/** Interface for the auth event emitter. */
interface IAuthEventEmitter {
  /** Subscribe to auth events. Returns an unsubscribe function. */
  subscribe: (listener: AuthEventListener) => () => void
  /** Emit an auth event to all subscribers. */
  emit: (event: IAuthEvent) => void
  /** Remove all subscribers. */
  clear: () => void
}

export type { AuthEventListener, AuthEventType, IAuthEvent, IAuthEventEmitter }
