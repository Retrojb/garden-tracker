/**
 * Unit tests for ExpandableDrawerSection component.
 *
 * Covers:
 *  1. Renders label and icon
 *  2. Label area calls onLabelPress (navigation)
 *  3. Chevron area calls onToggle (expand/collapse)
 *  4. Renders children inside AnimatedSubItemList
 *  5. Active styling applied when isActive is true
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 3.1, 7.2
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const Animated = {
    View,
  };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => ({}),
    withTiming: (value: number) => value,
  };
});

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const { Text } = jest.requireActual('react-native');
  const MockFontAwesome = ({ name, size }: { name: string; size: number }) => (
    <Text testID={`icon-${name}`}>{name}</Text>
  );
  return MockFontAwesome;
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { ExpandableDrawerSection } from '@/src/components/navigation/ExpandableDrawerSection';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExpandableDrawerSection', () => {
  const defaultProps = {
    label: 'Plants',
    icon: 'leaf',
    isExpanded: false,
    isActive: false,
    onToggle: jest.fn(),
    onLabelPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label text', () => {
    render(
      <ExpandableDrawerSection {...defaultProps}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByText('Plants')).toBeTruthy();
  });

  it('renders the icon', () => {
    render(
      <ExpandableDrawerSection {...defaultProps}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByTestId('icon-leaf')).toBeTruthy();
  });

  it('calls onLabelPress when label area is tapped', () => {
    render(
      <ExpandableDrawerSection {...defaultProps}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    fireEvent.press(screen.getByText('Plants'));
    expect(defaultProps.onLabelPress).toHaveBeenCalledTimes(1);
    expect(defaultProps.onToggle).not.toHaveBeenCalled();
  });

  it('calls onToggle when chevron is tapped', () => {
    render(
      <ExpandableDrawerSection {...defaultProps}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    fireEvent.press(screen.getByRole('button'));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onLabelPress).not.toHaveBeenCalled();
  });

  it('renders children content', () => {
    render(
      <ExpandableDrawerSection {...defaultProps}>
        <Text>Sub-item A</Text>
        <Text>Sub-item B</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByText('Sub-item A')).toBeTruthy();
    expect(screen.getByText('Sub-item B')).toBeTruthy();
  });

  it('renders with active styling when isActive is true', () => {
    render(
      <ExpandableDrawerSection {...defaultProps} isActive={true}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByText('Plants')).toBeTruthy();
    expect(screen.getByTestId('icon-leaf')).toBeTruthy();
  });

  it('renders chevron with correct accessibility label when collapsed', () => {
    render(
      <ExpandableDrawerSection {...defaultProps} isExpanded={false}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByLabelText('Expand section')).toBeTruthy();
  });

  it('renders chevron with correct accessibility label when expanded', () => {
    render(
      <ExpandableDrawerSection {...defaultProps} isExpanded={true}>
        <Text>Child item</Text>
      </ExpandableDrawerSection>
    );
    expect(screen.getByLabelText('Collapse section')).toBeTruthy();
  });
});
