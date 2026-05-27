/**
 * Unit tests for PlantRow component.
 *
 * Covers:
 *  1. Flex-wrap layout className is applied
 *  2. Card renders with variant="compact"
 *  3. Responsive classes are present
 *
 * Validates: Requirements 2.2, 2.3, 2.5
 */

import { render } from '@testing-library/react-native'
import React from 'react'

import { PlantRow } from '@/src/components/PlantRow'
import type { IPlant } from '@/src/types/TPlant'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCardCalls: Array<{ title?: string; variant?: string }> = []

jest.mock('@/src/components/Card', () => {
  const { View, Text } = jest.requireActual('react-native')
  const MockCard = ({ title, variant }: { title?: string; variant?: string }) => {
    mockCardCalls.push({ title, variant })
    return (
      <View testID={`card-${title}`}>
        <Text>{title}</Text>
        <Text testID={`variant-${title}`}>{variant}</Text>
      </View>
    )
  }
  return { Card: MockCard }
})

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockPlants: IPlant[] = [
  {
    id: '1',
    name: 'Tomato',
    species: 'Solanum lycopersicum',
    variety: 'Roma',
    gardenId: 'garden-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Basil',
    species: 'Ocimum basilicum',
    variety: 'Sweet',
    gardenId: 'garden-1',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlantRow', () => {
  beforeEach(() => {
    mockCardCalls.length = 0
  })

  describe('flex-wrap layout (Req 2.2)', () => {
    it('applies flex-row and flex-wrap classes to the container', () => {
      const { root } = render(<PlantRow plants={mockPlants} />)

      const containerClassName = root.props.className
      expect(containerClassName).toContain('flex-row')
      expect(containerClassName).toContain('flex-wrap')
    })

    it('merges custom className with default layout classes', () => {
      const { root } = render(
        <PlantRow plants={mockPlants} className="custom-class" />
      )

      const containerClassName = root.props.className
      expect(containerClassName).toContain('flex-row')
      expect(containerClassName).toContain('flex-wrap')
      expect(containerClassName).toContain('custom-class')
    })
  })

  describe('Card compact variant (Req 2.3)', () => {
    it('renders each Card with variant="compact"', () => {
      render(<PlantRow plants={mockPlants} />)

      expect(mockCardCalls).toHaveLength(2)
      mockCardCalls.forEach((call) => {
        expect(call.variant).toBe('compact')
      })
    })

    it('passes plant name as Card title', () => {
      render(<PlantRow plants={mockPlants} />)

      expect(mockCardCalls[0].title).toBe('Tomato')
      expect(mockCardCalls[1].title).toBe('Basil')
    })
  })

  describe('responsive classes (Req 2.5)', () => {
    it('applies responsive gap classes for different viewports', () => {
      const { root } = render(<PlantRow plants={mockPlants} />)

      const containerClassName = root.props.className
      expect(containerClassName).toContain('sm:gap-2')
      expect(containerClassName).toContain('md:gap-3')
      expect(containerClassName).toContain('lg:gap-4')
    })
  })
})
