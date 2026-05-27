/**
 * Unit tests for AuthGuard component.
 *
 * Covers:
 *  1. Renders loading indicator when status is 'loading'
 *  2. Renders LoginScreen when status is 'unauthenticated'
 *  3. Renders children when status is 'authenticated'
 *
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { render, screen } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuth = jest.fn()

jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('../LoginScreen', () => ({
  LoginScreen: () => {
    const { Text } = require('react-native')
    return <Text testID="login-screen">LoginScreen</Text>
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { AuthGuard } from '../AuthGuard'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthGuard', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('renders a loading indicator when status is loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading' })

    const { UNSAFE_getByType } = render(
      <AuthGuard>
        <Text testID="child-content">App Content</Text>
      </AuthGuard>
    )

    const { ActivityIndicator } = require('react-native')

    expect(screen.queryByTestId('child-content')).toBeNull()
    expect(screen.queryByTestId('login-screen')).toBeNull()
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
  })

  it('renders LoginScreen when status is unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' })

    render(
      <AuthGuard>
        <Text testID="child-content">App Content</Text>
      </AuthGuard>
    )

    expect(screen.getByTestId('login-screen')).toBeTruthy()
    expect(screen.queryByTestId('child-content')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renders children when status is authenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated' })

    render(
      <AuthGuard>
        <Text testID="child-content">App Content</Text>
      </AuthGuard>
    )

    expect(screen.getByTestId('child-content')).toBeTruthy()
    expect(screen.queryByTestId('login-screen')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('does not render children or LoginScreen while loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading' })

    render(
      <AuthGuard>
        <Text testID="child-content">App Content</Text>
      </AuthGuard>
    )

    expect(screen.queryByTestId('child-content')).toBeNull()
    expect(screen.queryByTestId('login-screen')).toBeNull()
  })
})
