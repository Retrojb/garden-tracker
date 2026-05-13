import { MOCK_PLANTS } from '@/src/__mocks__/mockPlants'
import { PlantCarousel } from '@/src/components/PlantCarousel'
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

describe('PlantCarousel', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders a card for each plant', () => {
    render(<PlantCarousel plants={MOCK_PLANTS} />)
    MOCK_PLANTS.forEach((plant) => {
      expect(screen.getByText(plant.name)).toBeTruthy()
    })
  })

  it('shows the empty state when no plants are provided', () => {
    render(<PlantCarousel plants={[]} />)
    expect(screen.getByText(/No plants yet/i)).toBeTruthy()
  })

  it('renders the "See all" button when onSeeAll is provided', () => {
    const onSeeAll = jest.fn()
    render(<PlantCarousel plants={MOCK_PLANTS} onSeeAll={onSeeAll} />)
    expect(screen.getByText('See all')).toBeTruthy()
  })

  it('does not render the "See all" button when onSeeAll is omitted', () => {
    render(<PlantCarousel plants={MOCK_PLANTS} />)
    expect(screen.queryByText('See all')).toBeNull()
  })

  it('calls onSeeAll when "See all" is pressed', () => {
    const onSeeAll = jest.fn()
    render(<PlantCarousel plants={MOCK_PLANTS} onSeeAll={onSeeAll} />)
    fireEvent.press(screen.getByText('See all'))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })

  it('navigates to the plant detail screen when a card is pressed', () => {
    render(<PlantCarousel plants={MOCK_PLANTS} />)
    fireEvent.press(screen.getByText(MOCK_PLANTS[0].name))
    expect(mockPush).toHaveBeenCalledWith(`/plants/${MOCK_PLANTS[0].id}`)
  })

  it('renders the variety text when a plant has a variety', () => {
    const plantWithVariety = MOCK_PLANTS.find((p) => p.variety)
    if (!plantWithVariety) return
    render(<PlantCarousel plants={[plantWithVariety]} />)
    expect(screen.getByText(plantWithVariety.variety!)).toBeTruthy()
  })
})
