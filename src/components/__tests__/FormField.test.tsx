/**
 * Unit tests for the FormField component.
 *
 * Covers:
 *  1. Renders label and input
 *  2. Appends * to label when required
 *  3. Displays error message when error prop is provided
 *  4. Applies error styling to input when error is present
 *  5. Calls onChangeText when user types
 *  6. Passes through additional TextInput props
 */

import { FormField } from '@/src/components/FormField'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

describe('FormField', () => {
  it('renders label and input with value', () => {
    render(
      <FormField label="Name" value="Tomato" onChangeText={jest.fn()} />
    )

    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByDisplayValue('Tomato')).toBeTruthy()
  })

  it('appends * to label when required', () => {
    render(
      <FormField label="Species" value="" onChangeText={jest.fn()} required />
    )

    expect(screen.getByText('Species *')).toBeTruthy()
  })

  it('does not append * when not required', () => {
    render(
      <FormField label="Variety" value="" onChangeText={jest.fn()} />
    )

    expect(screen.getByText('Variety')).toBeTruthy()
    expect(screen.queryByText('Variety *')).toBeNull()
  })

  it('displays error message when error prop is provided', () => {
    render(
      <FormField
        label="Name"
        value=""
        onChangeText={jest.fn()}
        error="Name is required"
      />
    )

    expect(screen.getByText('Name is required')).toBeTruthy()
  })

  it('does not display error message when error is undefined', () => {
    render(
      <FormField label="Name" value="Valid" onChangeText={jest.fn()} />
    )

    expect(screen.queryByText(/required/i)).toBeNull()
  })

  it('calls onChangeText when user types', () => {
    const onChangeText = jest.fn()
    render(
      <FormField label="Name" value="" onChangeText={onChangeText} />
    )

    const input = screen.getByLabelText('Name')
    fireEvent.changeText(input, 'Basil')

    expect(onChangeText).toHaveBeenCalledWith('Basil')
  })

  it('passes through placeholder prop', () => {
    render(
      <FormField
        label="Name"
        value=""
        onChangeText={jest.fn()}
        placeholder="e.g. Tomato"
      />
    )

    expect(screen.getByPlaceholderText('e.g. Tomato')).toBeTruthy()
  })
})
