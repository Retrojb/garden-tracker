/**
 * Unit tests for DrawerLayout component.
 *
 * Covers:
 *  1. Renders all four drawer items with correct labels
 *  2. Assigns correct FontAwesome icons to each drawer item
 *  3. Does not render a bottom tab bar
 *
 * Validates: Requirements 1.1, 1.3, 1.4, 4.1
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDrawerScreens: Array<{ name: string; options: Record<string, unknown> }> = []

jest.mock('expo-router/drawer', () => {
  const MockDrawerScreen = ({ name, options }: { name: string; options: Record<string, unknown> }) => {
    mockDrawerScreens.push({ name, options })
    return null
  }

  const MockDrawer = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  MockDrawer.Screen = MockDrawerScreen

  return { Drawer: MockDrawer }
})

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 1024, height: 768 }),
}))

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const { Text } = jest.requireActual('react-native')
  const MockFontAwesome = ({ name, size, color }: { name: string; size: number; color: string }) => (
    <Text testID={`icon-${name}`}>{name}</Text>
  )
  return MockFontAwesome
})

jest.mock('@/src/components/navigation/CustomDrawerContent', () => ({
  CustomDrawerContent: () => null,
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import DrawerLayout from '@/app/(drawer)/_layout';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DrawerLayout', () => {
  beforeEach(() => {
    mockDrawerScreens.length = 0
  })

  it('renders all four drawer items with correct labels', () => {
    render(<DrawerLayout />)

    const expectedTitles = ['Dashboard', 'Plants', 'Gardens', 'Settings']
    const renderedTitles = mockDrawerScreens.map((s) => s.options.title)

    expectedTitles.forEach((title) => {
      expect(renderedTitles).toContain(title)
    })
  })

  it('renders exactly four drawer screens', () => {
    render(<DrawerLayout />)

    expect(mockDrawerScreens).toHaveLength(4)
  })

  it('assigns correct route names to drawer screens', () => {
    render(<DrawerLayout />)

    const expectedNames = ['index', 'plants', 'gardens', 'settings']
    const renderedNames = mockDrawerScreens.map((s) => s.name)

    expectedNames.forEach((name) => {
      expect(renderedNames).toContain(name)
    })
  })

  it('assigns correct FontAwesome icons to each drawer item', () => {
    render(<DrawerLayout />)

    const expectedIcons: Record<string, string> = {
      index: 'home',
      plants: 'leaf',
      gardens: 'tree',
      settings: 'cog',
    }

    mockDrawerScreens.forEach((screenConfig) => {
      const drawerIcon = screenConfig.options.drawerIcon as ({ color }: { color: string }) => React.ReactElement
      const iconElement = drawerIcon({ color: '#000' })
      const iconName = (iconElement as React.ReactElement<{ name: string }>).props.name
      expect(iconName).toBe(expectedIcons[screenConfig.name])
    })
  })

  it('does not render a bottom tab bar', () => {
    const { root } = render(<DrawerLayout />)

    // Verify no Tab.Navigator or bottom tab bar elements are present
    expect(screen.queryByTestId('bottom-tab-bar')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
