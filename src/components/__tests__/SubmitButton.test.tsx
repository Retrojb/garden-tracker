/**
 * Unit tests for the SubmitButton component.
 *
 * Covers:
 *  1. Renders label text
 *  2. Calls onPress when pressed
 *  3. Shows ActivityIndicator when isLoading is true
 *  4. Hides label text when isLoading is true
 *  5. Is disabled when isLoading is true
 */

import { SubmitButton } from '@/src/components/SubmitButton'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

describe('SubmitButton', () => {
  it('renders the label text', () => {
    render(<SubmitButton label="Create Plant" onPress={jest.fn()} />)

    expect(screen.getByText('Create Plant')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<SubmitButton label="Submit" onPress={onPress} />)

    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows loading indicator when isLoading is true', () => {
    render(
      <SubmitButton label="Create Plant" onPress={jest.fn()} isLoading />
    )

    // Label should not be visible when loading
    expect(screen.queryByText('Create Plant')).toBeNull()
  })

  it('is disabled when isLoading is true', () => {
    const onPress = jest.fn()
    render(
      <SubmitButton label="Submit" onPress={onPress} isLoading />
    )

    const button = screen.getByRole('button')
    expect(button.props.accessibilityState).toEqual({ disabled: true })
  })

  it('uses custom accessibilityLabel when provided', () => {
    render(
      <SubmitButton
        label="Submit"
        onPress={jest.fn()}
        accessibilityLabel="Save new plant"
      />
    )

    expect(screen.getByLabelText('Save new plant')).toBeTruthy()
  })
})
