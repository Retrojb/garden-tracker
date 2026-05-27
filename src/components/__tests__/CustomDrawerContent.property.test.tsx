/**
 * Property-Based Test: Sub-item count equals data length
 *
 * **Property 3: Sub-item count equals data length**
 * For any non-empty array of items returned by `usePlants()` or `useGardens()`,
 * when the corresponding section is expanded, the number of rendered
 * `DrawerSubItem` components SHALL equal the length of the data array.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import { render, screen } from '@testing-library/react-native'
import * as fc from 'fast-check'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native')
  const Animated = { View }
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
  }
})

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const { Text } = jest.requireActual('react-native')
  const MockFontAwesome = ({ name }: { name: string }) => <Text testID={`icon-${name}`}>{name}</Text>
  return MockFontAwesome
})

const mockNavigate = jest.fn()
const mockCloseDrawer = jest.fn()
const mockRouterPush = jest.fn()
const mockUsePathname = jest.fn(() => '/')

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => mockUsePathname(),
}))

jest.mock('@react-navigation/drawer', () => ({
  DrawerContentScrollView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockUsePlants = jest.fn()
const mockUseGardens = jest.fn()

jest.mock('@/src/hooks/usePlants', () => ({
  usePlants: () => mockUsePlants(),
}))

jest.mock('@/src/hooks/useGardens', () => ({
  useGardens: () => mockUseGardens(),
}))

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 1024, height: 768 }),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { CustomDrawerContent } from '@/src/components/navigation/CustomDrawerContent'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Creates mock DrawerContentComponentProps */
const createMockDrawerProps = () => ({
  state: {
    routes: [
      { name: 'index', key: 'index-key' },
      { name: 'plants', key: 'plants-key' },
      { name: 'gardens', key: 'gardens-key' },
      { name: 'settings', key: 'settings-key' },
    ],
    index: 0,
    key: 'drawer-key',
    routeNames: ['index', 'plants', 'gardens', 'settings'],
    type: 'drawer' as const,
    stale: false as const,
  },
  navigation: {
    navigate: mockNavigate,
    closeDrawer: mockCloseDrawer,
    dispatch: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getParent: jest.fn(),
    getState: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setOptions: jest.fn(),
    getId: jest.fn(),
    openDrawer: jest.fn(),
    toggleDrawer: jest.fn(),
  },
  descriptors: {},
})

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a valid ISO date string within a safe range */
const isoDateArb = fc
  .integer({
    min: new Date('2000-01-01T00:00:00.000Z').getTime(),
    max: new Date('2030-12-31T23:59:59.999Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString())

/**
 * Generates a non-empty array of plants with unique names.
 * Each plant gets a name like "Plant-0", "Plant-1", etc. to avoid
 * text collisions with other UI elements (Dashboard, Plants, Gardens, Settings).
 */
const nonEmptyPlantsArb = fc
  .integer({ min: 1, max: 20 })
  .chain((count) =>
    fc.tuple(
      ...Array.from({ length: count }, (_, i) =>
        fc.record({
          id: fc.uuid(),
          name: fc.constant(`TestPlant-${i}`),
          species: fc.option(fc.constant(`Species-${i}`), { nil: undefined }),
          variety: fc.option(fc.constant(`Variety-${i}`), { nil: undefined }),
          gardenId: fc.uuid(),
          createdAt: isoDateArb,
          updatedAt: isoDateArb,
        })
      )
    )
  )

/**
 * Generates a non-empty array of gardens with unique names.
 * Each garden gets a name like "Garden-0", "Garden-1", etc.
 */
const nonEmptyGardensArb = fc
  .integer({ min: 1, max: 20 })
  .chain((count) =>
    fc.tuple(
      ...Array.from({ length: count }, (_, i) =>
        fc.record({
          id: fc.uuid(),
          name: fc.constant(`TestGarden-${i}`),
          type: fc.constantFrom('raised_bed', 'in_ground', 'container', 'greenhouse', 'other'),
          size: fc.constant(`${i + 1}x${i + 2} ft`),
          dimensions: fc.record({
            widthInches: fc.nat({ max: 1000 }),
            heightInches: fc.nat({ max: 1000 }),
            lengthInches: fc.nat({ max: 1000 }),
          }),
          createdAt: isoDateArb,
          updatedAt: isoDateArb,
        })
      )
    )
  )

// ---------------------------------------------------------------------------
// Property 3: Sub-item count equals data length
// **Validates: Requirements 4.1, 4.2**
// ---------------------------------------------------------------------------

describe('Property 3: Sub-item count equals data length', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('plants section renders one DrawerSubItem per plant when expanded', () => {
    fc.assert(
      fc.property(nonEmptyPlantsArb, (plants) => {
        mockUsePlants.mockReturnValue({ plants, isLoading: false, error: null })
        mockUseGardens.mockReturnValue({ gardens: [], isLoading: false, error: null })

        const props = createMockDrawerProps() as any

        const { unmount } = render(<CustomDrawerContent {...props} />)

        const { fireEvent } = require('@testing-library/react-native')

        // Find and press the Plants chevron to expand
        const expandButtons = screen.getAllByRole('button')
        // First button is Plants chevron, second is Gardens chevron
        fireEvent.press(expandButtons[0])

        // Count rendered sub-items for plants section by checking each unique label
        let foundCount = 0
        for (const plant of plants) {
          const label = plant.name || plant.species || 'Unnamed Plant'
          if (screen.queryByText(label) !== null) {
            foundCount++
          }
        }

        expect(foundCount).toBe(plants.length)

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('gardens section renders one DrawerSubItem per garden when expanded', () => {
    fc.assert(
      fc.property(nonEmptyGardensArb, (gardens) => {
        mockUsePlants.mockReturnValue({ plants: [], isLoading: false, error: null })
        mockUseGardens.mockReturnValue({ gardens, isLoading: false, error: null })

        const props = createMockDrawerProps() as any

        const { unmount } = render(<CustomDrawerContent {...props} />)

        const { fireEvent } = require('@testing-library/react-native')

        // Find and press the Gardens chevron to expand
        const expandButtons = screen.getAllByRole('button')
        // Second button is Gardens chevron
        fireEvent.press(expandButtons[1])

        // Count rendered sub-items for gardens section by checking each unique label
        let foundCount = 0
        for (const garden of gardens) {
          if (screen.queryByText(garden.name) !== null) {
            foundCount++
          }
        }

        expect(foundCount).toBe(gardens.length)

        unmount()
      }),
      { numRuns: 100 }
    )
  })
})
