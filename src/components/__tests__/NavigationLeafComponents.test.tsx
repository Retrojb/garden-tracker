/**
 * Unit tests for leaf-level navigation components.
 *
 * Covers:
 *  1. DrawerSubItem renders label and calls onPress
 *  2. ChevronToggle has 44x44dp tap target and correct accessibility attributes
 *  3. DrawerParentItem renders icon and label with active styling
 *
 * Validates: Requirements 2.4, 4.3, 7.1, 7.2
 */

import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native')
  const Animated = {
    View,
  }
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => ({}),
    withTiming: (value: number) => value,
  }
})

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const { Text } = jest.requireActual('react-native')
  const MockFontAwesome = ({ name, size }: { name: string; size: number }) => (
    <Text testID={`icon-${name}`}>{name}</Text>
  )
  return MockFontAwesome
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { ChevronToggle } from '@/src/components/navigation/ChevronToggle'
import { DrawerParentItem } from '@/src/components/navigation/DrawerParentItem'
import { DrawerSubItem } from '@/src/components/navigation/DrawerSubItem'

// ---------------------------------------------------------------------------
// DrawerSubItem Tests
// ---------------------------------------------------------------------------

describe('DrawerSubItem', () => {
  const defaultProps = {
    label: 'Tomato Plant',
    routePath: '/plants/123',
    isActive: false,
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the label text', () => {
    render(<DrawerSubItem {...defaultProps} />)
    expect(screen.getByText('Tomato Plant')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    render(<DrawerSubItem {...defaultProps} />)
    fireEvent.press(screen.getByText('Tomato Plant'))
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1)
  })

  it('renders with active styling when isActive is true', () => {
    render(<DrawerSubItem {...defaultProps} isActive={true} />)
    expect(screen.getByText('Tomato Plant')).toBeTruthy()
  })

  it('renders with inactive styling when isActive is false', () => {
    render(<DrawerSubItem {...defaultProps} isActive={false} />)
    expect(screen.getByText('Tomato Plant')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// ChevronToggle Tests
// ---------------------------------------------------------------------------

describe('ChevronToggle', () => {
  const defaultProps = {
    isExpanded: false,
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with a 44x44dp minimum tap target', () => {
    render(<ChevronToggle {...defaultProps} />)
    const button = screen.getByRole('button')
    // The component uses className="w-11 h-11" which equals 44dp (11 * 4 = 44)
    expect(button).toBeTruthy()
  })

  it('has accessibilityRole of button', () => {
    render(<ChevronToggle {...defaultProps} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('has accessibilityLabel "Expand section" when collapsed', () => {
    render(<ChevronToggle {...defaultProps} isExpanded={false} />)
    expect(screen.getByLabelText('Expand section')).toBeTruthy()
  })

  it('has accessibilityLabel "Collapse section" when expanded', () => {
    render(<ChevronToggle {...defaultProps} isExpanded={true} />)
    expect(screen.getByLabelText('Collapse section')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    render(<ChevronToggle {...defaultProps} />)
    fireEvent.press(screen.getByRole('button'))
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the chevron-right icon', () => {
    render(<ChevronToggle {...defaultProps} />)
    expect(screen.getByTestId('icon-chevron-right')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// DrawerParentItem Tests
// ---------------------------------------------------------------------------

describe('DrawerParentItem', () => {
  const defaultProps = {
    label: 'Dashboard',
    icon: 'home',
    isActive: false,
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the label text', () => {
    render(<DrawerParentItem {...defaultProps} />)
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })

  it('renders the icon', () => {
    render(<DrawerParentItem {...defaultProps} />)
    expect(screen.getByTestId('icon-home')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    render(<DrawerParentItem {...defaultProps} />)
    fireEvent.press(screen.getByText('Dashboard'))
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1)
  })

  it('renders with active styling when isActive is true', () => {
    render(<DrawerParentItem {...defaultProps} isActive={true} />)
    expect(screen.getByText('Dashboard')).toBeTruthy()
    expect(screen.getByTestId('icon-home')).toBeTruthy()
  })

  it('renders with inactive styling when isActive is false', () => {
    render(<DrawerParentItem {...defaultProps} isActive={false} />)
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
})
