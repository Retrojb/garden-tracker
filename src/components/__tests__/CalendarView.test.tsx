/**
 * Unit tests for the CalendarView component.
 *
 * Covers:
 *  1. Renders the Calendar component from react-native-calendars
 *  2. Passes marked dates with event dots to the Calendar
 *  3. Calls onDayPress when a day is pressed
 *  4. Displays event list when a date with events is selected
 *  5. Calls onEventPress when an event item is pressed
 *  6. Supports swipe navigation (enableSwipeMonths prop)
 *  7. Highlights today's date via theme
 */

import { CalendarView } from '@/src/components/CalendarView'
import type { ICalendarEvent } from '@/src/types/TCalendar'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

// Mock react-native-calendars
jest.mock('react-native-calendars', () => {
  const { View, Text, Pressable } = require('react-native')
  const React = require('react')

  const Calendar = (props: {
    markedDates?: Record<string, unknown>
    onDayPress?: (day: { dateString: string }) => void
    enableSwipeMonths?: boolean
    markingType?: string
    theme?: Record<string, unknown>
  }) => {
    return React.createElement(
      View,
      { testID: 'calendar-component' },
      React.createElement(Text, { testID: 'marking-type' }, props.markingType),
      props.enableSwipeMonths &&
        React.createElement(Text, { testID: 'swipe-enabled' }, 'swipe'),
      props.theme?.todayTextColor &&
        React.createElement(Text, { testID: 'today-highlight' }, 'today-highlighted'),
      React.createElement(
        Pressable,
        {
          testID: 'day-press-trigger',
          onPress: () => props.onDayPress?.({ dateString: '2024-06-15' }),
        },
        React.createElement(Text, null, 'Press Day')
      )
    )
  }

  return { Calendar }
})

const createEvent = (overrides: Partial<ICalendarEvent> = {}): ICalendarEvent => ({
  id: 'event-1',
  plantId: 'plant-1',
  eventType: 'planted',
  date: '2024-06-15',
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
  ...overrides,
})

describe('CalendarView', () => {
  const defaultProps = {
    events: [] as ICalendarEvent[],
    onDayPress: jest.fn(),
    onEventPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Calendar component', () => {
    render(<CalendarView {...defaultProps} />)

    expect(screen.getByTestId('calendar-component')).toBeTruthy()
  })

  it('uses multi-dot marking type for event dots', () => {
    render(<CalendarView {...defaultProps} />)

    expect(screen.getByTestId('marking-type')).toHaveTextContent('multi-dot')
  })

  it('enables swipe navigation between months', () => {
    render(<CalendarView {...defaultProps} />)

    expect(screen.getByTestId('swipe-enabled')).toBeTruthy()
  })

  it('highlights today via theme configuration', () => {
    render(<CalendarView {...defaultProps} />)

    expect(screen.getByTestId('today-highlight')).toBeTruthy()
  })

  it('calls onDayPress when a day is pressed', () => {
    const onDayPress = jest.fn()
    render(<CalendarView {...defaultProps} onDayPress={onDayPress} />)

    fireEvent.press(screen.getByTestId('day-press-trigger'))

    expect(onDayPress).toHaveBeenCalledWith('2024-06-15')
  })

  it('displays events for the selected date', () => {
    const events = [
      createEvent({ id: 'e1', eventType: 'planted', date: '2024-06-15' }),
      createEvent({ id: 'e2', eventType: 'watered', date: '2024-06-15' }),
      createEvent({ id: 'e3', eventType: 'harvested', date: '2024-06-20' }),
    ]

    render(<CalendarView {...defaultProps} events={events} />)

    // Press a day to select it and show events
    fireEvent.press(screen.getByTestId('day-press-trigger'))

    // Should show events for 2024-06-15 (2 events), not 2024-06-20
    expect(screen.getByText('planted')).toBeTruthy()
    expect(screen.getByText('watered')).toBeTruthy()
    expect(screen.queryByText('harvested')).toBeNull()
  })

  it('calls onEventPress when an event item is pressed', () => {
    const onEventPress = jest.fn()
    const events = [
      createEvent({ id: 'e1', eventType: 'planted', date: '2024-06-15' }),
    ]

    render(<CalendarView {...defaultProps} events={events} onEventPress={onEventPress} />)

    // Select the date first
    fireEvent.press(screen.getByTestId('day-press-trigger'))

    // Press the event item
    fireEvent.press(screen.getByText('planted'))

    expect(onEventPress).toHaveBeenCalledWith(events[0])
  })

  it('displays event notes when available', () => {
    const events = [
      createEvent({ id: 'e1', date: '2024-06-15', notes: 'First planting of season' }),
    ]

    render(<CalendarView {...defaultProps} events={events} />)

    fireEvent.press(screen.getByTestId('day-press-trigger'))

    expect(screen.getByText(/First planting of season/)).toBeTruthy()
  })

  it('does not show event list when no date is selected', () => {
    const events = [
      createEvent({ id: 'e1', eventType: 'planted', date: '2024-06-15' }),
    ]

    render(<CalendarView {...defaultProps} events={events} />)

    // No date selected yet, so no event list
    expect(screen.queryByText('planted')).toBeNull()
  })

  it('does not show event list when selected date has no events', () => {
    const events = [
      createEvent({ id: 'e1', eventType: 'planted', date: '2024-06-20' }),
    ]

    render(<CalendarView {...defaultProps} events={events} />)

    // Press day (which triggers with date 2024-06-15 in our mock)
    fireEvent.press(screen.getByTestId('day-press-trigger'))

    // No events on 2024-06-15
    expect(screen.queryByText('planted')).toBeNull()
  })
})
