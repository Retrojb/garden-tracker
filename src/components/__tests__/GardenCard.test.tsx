import { GardenCard } from '@/src/components/GardenCard'
import type { IGarden } from '@/src/types/TGarden'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockGarden: IGarden = {
  id: 'garden-1',
  name: 'Tomato Bed',
  type: 'raised_bed',
  size: '4x8 ft',
  dimensions: { widthInches: 48, heightInches: 96, lengthInches: 12 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GardenCard', () => {
  const onPress = jest.fn()
  const onEdit = jest.fn()
  const onDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders garden name', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('Tomato Bed')).toBeTruthy()
  })

  it('renders garden type as a formatted label', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('Raised Bed')).toBeTruthy()
  })

  it('renders garden size', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('4x8 ft')).toBeTruthy()
  })

  it('calls onPress with garden id when card is pressed', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    fireEvent.press(screen.getByLabelText('View garden Tomato Bed'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith('garden-1')
  })

  it('calls onEdit with garden object when edit button is pressed', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    fireEvent.press(screen.getByLabelText('Edit garden Tomato Bed'))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(mockGarden)
  })

  it('calls onDelete with garden id when delete button is pressed', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    fireEvent.press(screen.getByLabelText('Delete garden Tomato Bed'))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('garden-1')
  })

  it('does not trigger onPress when edit button is pressed', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    fireEvent.press(screen.getByLabelText('Edit garden Tomato Bed'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('does not trigger onPress when delete button is pressed', () => {
    render(
      <GardenCard
        garden={mockGarden}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    fireEvent.press(screen.getByLabelText('Delete garden Tomato Bed'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders all garden types correctly', () => {
    const types = [
      { type: 'in_ground', label: 'In Ground' },
      { type: 'container', label: 'Container' },
      { type: 'greenhouse', label: 'Greenhouse' },
      { type: 'other', label: 'Other' },
    ] as const

    for (const { type, label } of types) {
      const garden = { ...mockGarden, type }
      const { unmount } = render(
        <GardenCard
          garden={garden}
          onPress={onPress}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
      expect(screen.getByText(label)).toBeTruthy()
      unmount()
    }
  })
})
