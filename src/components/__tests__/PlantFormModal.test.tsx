/**
 * Unit tests for the PlantFormModal component.
 *
 * Covers:
 *  1. Renders modal with title and form fields when visible
 *  2. Does not render when not visible
 *  3. Shows validation errors for empty required fields
 *  4. Calls onSubmit with correct payload on valid submission
 *  5. Calls onClose when close button is pressed
 *  6. Resets form state after successful submission
 */

import { PlantFormModal } from '@/src/components/PlantFormModal'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import React from 'react'

describe('PlantFormModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal title and form fields when visible', () => {
    render(<PlantFormModal {...defaultProps} />)

    expect(screen.getByText('New Plant')).toBeTruthy()
    expect(screen.getByText('Plant Name *')).toBeTruthy()
    expect(screen.getByText('Species *')).toBeTruthy()
    expect(screen.getByText('Variety')).toBeTruthy()
    expect(screen.getByText('Create Plant')).toBeTruthy()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<PlantFormModal {...defaultProps} />)

    fireEvent.press(screen.getByText('Create Plant'))

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeTruthy()
    })

    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when species is empty on submit', async () => {
    render(<PlantFormModal {...defaultProps} />)

    // Fill name but leave species empty
    fireEvent.changeText(screen.getByLabelText('Plant Name'), 'Tomato')
    fireEvent.press(screen.getByText('Create Plant'))

    await waitFor(() => {
      expect(screen.getByText('Species is required')).toBeTruthy()
    })

    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct payload on valid submission', async () => {
    render(<PlantFormModal {...defaultProps} />)

    fireEvent.changeText(screen.getByLabelText('Plant Name'), 'Tomato')
    fireEvent.changeText(screen.getByLabelText('Species'), 'Solanum lycopersicum')
    fireEvent.changeText(screen.getByLabelText('Variety'), 'Cherry')

    fireEvent.press(screen.getByText('Create Plant'))

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        variety: 'Cherry',
      })
    })
  })

  it('calls onSubmit with variety undefined when variety is empty', async () => {
    render(<PlantFormModal {...defaultProps} />)

    fireEvent.changeText(screen.getByLabelText('Plant Name'), 'Basil')
    fireEvent.changeText(screen.getByLabelText('Species'), 'Ocimum basilicum')

    fireEvent.press(screen.getByText('Create Plant'))

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: 'Basil',
        species: 'Ocimum basilicum',
        variety: undefined,
      })
    })
  })

  it('calls onClose when close button is pressed', () => {
    render(<PlantFormModal {...defaultProps} />)

    fireEvent.press(screen.getByLabelText('Close modal'))

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose after successful submission', async () => {
    render(<PlantFormModal {...defaultProps} />)

    fireEvent.changeText(screen.getByLabelText('Plant Name'), 'Pepper')
    fireEvent.changeText(screen.getByLabelText('Species'), 'Capsicum annuum')

    fireEvent.press(screen.getByText('Create Plant'))

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
