/**
 * Unit tests for the FormModal component.
 *
 * Covers:
 *  1. Renders modal with title and children when visible
 *  2. Does not render content when not visible
 *  3. Calls onClose when close button is pressed
 *  4. Calls onClose when backdrop is pressed
 *  5. Renders children content correctly
 *  6. Displays the provided title in the header
 */

import { FormModal } from '@/src/components/FormModal'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'

describe('FormModal', () => {
  const defaultProps = {
    visible: true,
    title: 'Test Modal',
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal title and children when visible', () => {
    render(
      <FormModal {...defaultProps}>
        <Text>Form Content</Text>
      </FormModal>
    )

    expect(screen.getByText('Test Modal')).toBeTruthy()
    expect(screen.getByText('Form Content')).toBeTruthy()
  })

  it('does not render content when not visible', () => {
    render(
      <FormModal {...defaultProps} visible={false}>
        <Text>Form Content</Text>
      </FormModal>
    )

    expect(screen.queryByText('Test Modal')).toBeNull()
    expect(screen.queryByText('Form Content')).toBeNull()
  })

  it('calls onClose when close button is pressed', () => {
    render(
      <FormModal {...defaultProps}>
        <Text>Form Content</Text>
      </FormModal>
    )

    const closeButtons = screen.getAllByLabelText('Close modal')
    // The close button in the header
    fireEvent.press(closeButtons[closeButtons.length - 1])

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is pressed', () => {
    render(
      <FormModal {...defaultProps}>
        <Text>Form Content</Text>
      </FormModal>
    )

    const closeButtons = screen.getAllByLabelText('Close modal')
    // The backdrop pressable (first one)
    fireEvent.press(closeButtons[0])

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('renders arbitrary children content', () => {
    render(
      <FormModal {...defaultProps}>
        <Text>First Field</Text>
        <Text>Second Field</Text>
      </FormModal>
    )

    expect(screen.getByText('First Field')).toBeTruthy()
    expect(screen.getByText('Second Field')).toBeTruthy()
  })

  it('displays the provided title in the header', () => {
    render(
      <FormModal {...defaultProps} title="New Garden">
        <Text>Content</Text>
      </FormModal>
    )

    expect(screen.getByText('New Garden')).toBeTruthy()
  })
})
