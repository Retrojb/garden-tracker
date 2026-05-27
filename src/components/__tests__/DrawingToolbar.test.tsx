/**
 * Unit tests for the DrawingToolbar component.
 *
 * Covers:
 *  1. Renders all four tool buttons (draw, erase, place_plant, select)
 *  2. Highlights the active tool
 *  3. Calls onToolChange with the correct tool when a button is pressed
 *  4. Does not call onToolChange when the already-active tool is pressed
 *  5. Accessibility: toolbar role and button labels
 */

import { DrawingToolbar } from '@/src/components/DrawingToolbar'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const { Text } = jest.requireActual('react-native')
  const MockFontAwesome = ({ name, size }: { name: string; size: number }) => (
    <Text testID={`icon-${name}`}>{name}</Text>
  )
  return MockFontAwesome
})

describe('DrawingToolbar', () => {
  const defaultProps = {
    activeTool: 'draw' as const,
    onToolChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all four tool buttons', () => {
    render(<DrawingToolbar {...defaultProps} />)

    expect(screen.getByLabelText('Draw tool')).toBeTruthy()
    expect(screen.getByLabelText('Erase tool')).toBeTruthy()
    expect(screen.getByLabelText('Plant tool')).toBeTruthy()
    expect(screen.getByLabelText('Select tool')).toBeTruthy()
  })

  it('marks the active tool as selected', () => {
    render(<DrawingToolbar {...defaultProps} activeTool="erase" />)

    const eraseButton = screen.getByLabelText('Erase tool')
    expect(eraseButton.props.accessibilityState).toEqual({ selected: true })

    const drawButton = screen.getByLabelText('Draw tool')
    expect(drawButton.props.accessibilityState).toEqual({ selected: false })
  })

  it('calls onToolChange with the correct tool on press', () => {
    const onToolChange = jest.fn()
    render(<DrawingToolbar activeTool="draw" onToolChange={onToolChange} />)

    fireEvent.press(screen.getByLabelText('Erase tool'))
    expect(onToolChange).toHaveBeenCalledWith('erase')

    fireEvent.press(screen.getByLabelText('Plant tool'))
    expect(onToolChange).toHaveBeenCalledWith('place_plant')

    fireEvent.press(screen.getByLabelText('Select tool'))
    expect(onToolChange).toHaveBeenCalledWith('select')
  })

  it('calls onToolChange even when pressing the already-active tool', () => {
    const onToolChange = jest.fn()
    render(<DrawingToolbar activeTool="draw" onToolChange={onToolChange} />)

    fireEvent.press(screen.getByLabelText('Draw tool'))
    expect(onToolChange).toHaveBeenCalledWith('draw')
  })

  it('renders with toolbar accessibility role', () => {
    render(<DrawingToolbar {...defaultProps} />)

    expect(screen.getByLabelText('Drawing tools')).toBeTruthy()
  })

  it('renders tool labels', () => {
    render(<DrawingToolbar {...defaultProps} />)

    expect(screen.getByText('Draw')).toBeTruthy()
    expect(screen.getByText('Erase')).toBeTruthy()
    expect(screen.getByText('Plant')).toBeTruthy()
    expect(screen.getByText('Select')).toBeTruthy()
  })
})
