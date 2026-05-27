import React, { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Calendar, type DateData, type MarkedDates } from 'react-native-calendars'

import type { ICalendarEvent, TEventType } from '@/src/types/TCalendar'

interface CalendarViewProps {
  /** Events to display on the calendar */
  events: ICalendarEvent[]
  /** Called when user taps a date */
  onDayPress: (date: string) => void
  /** Called when user taps an event marker */
  onEventPress: (event: ICalendarEvent) => void
}

const EVENT_TYPE_COLORS: Record<TEventType, string> = {
  planted: '#4CAF50',
  fertilized: '#8BC34A',
  harvested: '#FF9800',
  watered: '#2196F3',
  pruned: '#9C27B0',
  custom: '#607D8B',
}

/**
 * Builds the marked dates object for react-native-calendars.
 * Each date with events gets colored dots representing the event types.
 */
const buildMarkedDates = (events: readonly ICalendarEvent[]): MarkedDates => {
  const dateMap: Record<string, { dots: Array<{ key: string; color: string }> }> = {}

  for (const event of events) {
    const existing = dateMap[event.date]
    const dot = { key: event.id, color: EVENT_TYPE_COLORS[event.eventType] }

    if (existing) {
      dateMap[event.date] = { dots: [...existing.dots, dot] }
    } else {
      dateMap[event.date] = { dots: [dot] }
    }
  }

  const markedDates: MarkedDates = {}
  for (const [date, value] of Object.entries(dateMap)) {
    markedDates[date] = {
      dots: value.dots,
      marked: true,
    }
  }

  return markedDates
}

/**
 * Groups events by date for rendering event lists below the calendar.
 */
const groupEventsByDate = (
  events: readonly ICalendarEvent[],
  date: string
): readonly ICalendarEvent[] => {
  return events.filter((event) => event.date === date)
}

/**
 * CalendarView renders a monthly calendar grid with event dots using react-native-calendars.
 * Supports swipe navigation between months, highlights today's date,
 * and calls onDayPress/onEventPress callbacks.
 */
const CalendarView = ({ events, onDayPress, onEventPress }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)

  const markedDates = useMemo(() => {
    const dates = buildMarkedDates(events)

    if (selectedDate) {
      const existing = dates[selectedDate] ?? {}
      dates[selectedDate] = {
        ...existing,
        selected: true,
        selectedColor: '#6366F1',
      }
    }

    return dates
  }, [events, selectedDate])

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    return groupEventsByDate(events, selectedDate)
  }, [events, selectedDate])

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString)
    onDayPress(day.dateString)
  }

  return (
    <View className="flex-1">
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        enableSwipeMonths
        theme={{
          todayTextColor: '#6366F1',
          todayBackgroundColor: '#EEF2FF',
          selectedDayBackgroundColor: '#6366F1',
          selectedDayTextColor: '#FFFFFF',
          arrowColor: '#6366F1',
          dotStyle: { marginTop: 2 },
        }}
      />

      {selectedDate && selectedDateEvents.length > 0 && (
        <View className="mt-4 px-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Events on {selectedDate}
          </Text>
          {selectedDateEvents.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => onEventPress(event)}
              className="flex-row items-center py-2 px-3 mb-2 rounded-lg bg-gray-50"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: EVENT_TYPE_COLORS[event.eventType] }}
              />
              <Text className="text-sm text-gray-800 capitalize">
                {event.eventType}
              </Text>
              {event.notes && (
                <Text className="text-xs text-gray-500 ml-2" numberOfLines={1}>
                  — {event.notes}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

export { CalendarView }
export type { CalendarViewProps }

