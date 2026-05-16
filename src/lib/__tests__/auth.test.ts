/**
 * Unit tests for src/lib/auth.ts
 *
 * Tests cover:
 * - Auth event emitter (subscribe, emit, unsubscribe, clear)
 * - refreshToken (success and failure paths)
 * - signOut (clears MMKV, clears SQLite queue, calls Amplify, navigates)
 *
 * Requirements: 7.2, 7.3, 7.5
 */

import type { IAuthEvent } from '../../types/TAuth'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchAuthSession = jest.fn()
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}))

const mockAmplifySignOut = jest.fn()
jest.mock('../amplify', () => ({
  signOut: () => mockAmplifySignOut(),
}))

const mockClearStorage = jest.fn()
jest.mock('../storage', () => ({
  clear: () => mockClearStorage(),
}))

const mockClearMutationQueue = jest.fn()
jest.mock('../mutationQueueClear', () => ({
  clearMutationQueue: () => mockClearMutationQueue(),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import {
    authEvents,
    createAuthEventEmitter,
    refreshToken,
    signOut,
} from '../auth'

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  authEvents.clear()
})

// ---------------------------------------------------------------------------
// Auth Event Emitter
// ---------------------------------------------------------------------------

describe('createAuthEventEmitter', () => {
  it('creates an independent emitter instance', () => {
    const emitter = createAuthEventEmitter()
    expect(emitter.subscribe).toBeDefined()
    expect(emitter.emit).toBeDefined()
    expect(emitter.clear).toBeDefined()
  })

  it('notifies subscribers when an event is emitted', () => {
    const emitter = createAuthEventEmitter()
    const listener = jest.fn()
    emitter.subscribe(listener)

    const event: IAuthEvent = { type: 'TOKEN_REFRESH_FAILED' }
    emitter.emit(event)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(event)
  })

  it('supports multiple subscribers', () => {
    const emitter = createAuthEventEmitter()
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    emitter.subscribe(listener1)
    emitter.subscribe(listener2)

    const event: IAuthEvent = { type: 'SIGNED_OUT' }
    emitter.emit(event)

    expect(listener1).toHaveBeenCalledWith(event)
    expect(listener2).toHaveBeenCalledWith(event)
  })

  it('unsubscribes a listener via the returned function', () => {
    const emitter = createAuthEventEmitter()
    const listener = jest.fn()
    const unsubscribe = emitter.subscribe(listener)

    unsubscribe()
    emitter.emit({ type: 'TOKEN_REFRESH_FAILED' })

    expect(listener).not.toHaveBeenCalled()
  })

  it('clear removes all subscribers', () => {
    const emitter = createAuthEventEmitter()
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    emitter.subscribe(listener1)
    emitter.subscribe(listener2)

    emitter.clear()
    emitter.emit({ type: 'SIGNED_OUT' })

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).not.toHaveBeenCalled()
  })

  it('does not notify a listener that was already unsubscribed', () => {
    const emitter = createAuthEventEmitter()
    const listener = jest.fn()
    const unsubscribe = emitter.subscribe(listener)

    emitter.emit({ type: 'TOKEN_REFRESH_FAILED' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    emitter.emit({ type: 'TOKEN_REFRESH_FAILED' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Singleton authEvents
// ---------------------------------------------------------------------------

describe('authEvents (singleton)', () => {
  it('emits events to subscribed listeners', () => {
    const listener = jest.fn()
    authEvents.subscribe(listener)

    authEvents.emit({ type: 'TOKEN_REFRESH_FAILED' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// refreshToken
// ---------------------------------------------------------------------------

describe('refreshToken', () => {
  it('returns the access token on successful refresh', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: { accessToken: { toString: () => 'fresh-jwt-token' } },
    })

    const token = await refreshToken()

    expect(token).toBe('fresh-jwt-token')
    expect(mockFetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true })
  })

  it('emits TOKEN_REFRESH_FAILED and returns null when no token is returned', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: {} })
    const listener = jest.fn()
    authEvents.subscribe(listener)

    const token = await refreshToken()

    expect(token).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TOKEN_REFRESH_FAILED' })
    )
  })

  it('emits TOKEN_REFRESH_FAILED and returns null when fetchAuthSession throws', async () => {
    const error = new Error('Network error')
    mockFetchAuthSession.mockRejectedValue(error)
    const listener = jest.fn()
    authEvents.subscribe(listener)

    const token = await refreshToken()

    expect(token).toBeNull()
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TOKEN_REFRESH_FAILED',
        error,
      })
    )
  })

  it('wraps non-Error thrown values in an Error', async () => {
    mockFetchAuthSession.mockRejectedValue('string error')
    const listener = jest.fn()
    authEvents.subscribe(listener)

    await refreshToken()

    const emittedEvent = listener.mock.calls[0][0] as IAuthEvent
    expect(emittedEvent.error).toBeInstanceOf(Error)
    expect(emittedEvent.error?.message).toBe('string error')
  })

  it('returns null when session has no tokens property', async () => {
    mockFetchAuthSession.mockResolvedValue({})
    const listener = jest.fn()
    authEvents.subscribe(listener)

    const token = await refreshToken()

    expect(token).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('signOut', () => {
  beforeEach(() => {
    mockClearMutationQueue.mockResolvedValue(undefined)
    mockAmplifySignOut.mockResolvedValue(undefined)
  })

  it('clears MMKV storage', async () => {
    await signOut()
    expect(mockClearStorage).toHaveBeenCalledTimes(1)
  })

  it('clears the SQLite mutation queue', async () => {
    await signOut()
    expect(mockClearMutationQueue).toHaveBeenCalledTimes(1)
  })

  it('calls Amplify signOut', async () => {
    await signOut()
    expect(mockAmplifySignOut).toHaveBeenCalledTimes(1)
  })

  it('emits SIGNED_OUT event', async () => {
    const listener = jest.fn()
    authEvents.subscribe(listener)

    await signOut()

    expect(listener).toHaveBeenCalledWith({ type: 'SIGNED_OUT' })
  })

  it('navigates to the sign-in screen', async () => {
    await signOut()
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/sign-in')
  })

  it('executes steps in the correct order: clear caches → amplify → emit → navigate', async () => {
    const callOrder: string[] = []

    mockClearStorage.mockImplementation(() => {
      callOrder.push('clearStorage')
    })
    mockClearMutationQueue.mockImplementation(async () => {
      callOrder.push('clearMutationQueue')
    })
    mockAmplifySignOut.mockImplementation(async () => {
      callOrder.push('amplifySignOut')
    })
    mockRouterReplace.mockImplementation(() => {
      callOrder.push('routerReplace')
    })

    const listener = jest.fn(() => {
      callOrder.push('emitSignedOut')
    })
    authEvents.subscribe(listener)

    await signOut()

    expect(callOrder).toEqual([
      'clearStorage',
      'clearMutationQueue',
      'amplifySignOut',
      'emitSignedOut',
      'routerReplace',
    ])
  })
})
