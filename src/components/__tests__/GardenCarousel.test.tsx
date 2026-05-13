import { MOCK_GARDENS } from '@/src/__mocks__/mockGarden'
import { GardenCarousel } from '@/src/components/GardenCarousel'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GardenCarousel', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders a card for each garden', () => {
    render(<GardenCarousel gardens={MOCK_GARDENS} />)
    MOCK_GARDENS.forEach((garden) => {
      expect(screen.getByText(garden.name)).toBeTruthy()
    })
  })

  it('shows the empty state when no gardens are provided', () => {
    render(<GardenCarousel gardens={[]} />)
    expect(screen.getByText(/No gardens yet/i)).toBeTruthy()
  })

  it('renders the "See all" button when onSeeAll is provided', () => {
    const onSeeAll = jest.fn()
    render(<GardenCarousel gardens={MOCK_GARDENS} onSeeAll={onSeeAll} />)
    expect(screen.getByText('See all')).toBeTruthy()
  })

  it('does not render the "See all" button when onSeeAll is omitted', () => {
    render(<GardenCarousel gardens={MOCK_GARDENS} />)
    expect(screen.queryByText('See all')).toBeNull()
  })

  it('calls onSeeAll when "See all" is pressed', () => {
    const onSeeAll = jest.fn()
    render(<GardenCarousel gardens={MOCK_GARDENS} onSeeAll={onSeeAll} />)
    fireEvent.press(screen.getByText('See all'))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })

  it('navigates to the garden detail screen when a card is pressed', () => {
    render(<GardenCarousel gardens={MOCK_GARDENS} />)
    fireEvent.press(screen.getByText(MOCK_GARDENS[0].name))
    expect(mockPush).toHaveBeenCalledWith(`/gardens/${MOCK_GARDENS[0].id}`)
  })
})
