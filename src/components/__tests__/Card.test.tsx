import { Card } from '@/src/components/Card'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Card', () => {
  const title = 'Test Title'
  const subtitle = 'Test Subtitle'
  const childText = 'Child Content'

  describe('default variant (no variant prop)', () => {
    it('renders title and subtitle', () => {
      render(<Card title={title} subtitle={subtitle} />)
      expect(screen.getByText(title)).toBeTruthy()
      expect(screen.getByText(subtitle)).toBeTruthy()
    })

    it('omits children', () => {
      render(
        <Card title={title} subtitle={subtitle}>
          <Text>{childText}</Text>
        </Card>
      )
      expect(screen.queryByText(childText)).toBeNull()
    })
  })

  describe('compact variant', () => {
    it('renders only the title', () => {
      render(<Card title={title} subtitle={subtitle} variant="compact" />)
      expect(screen.getByText(title)).toBeTruthy()
    })

    it('omits subtitle', () => {
      render(<Card title={title} subtitle={subtitle} variant="compact" />)
      expect(screen.queryByText(subtitle)).toBeNull()
    })

    it('omits children', () => {
      render(
        <Card title={title} subtitle={subtitle} variant="compact">
          <Text>{childText}</Text>
        </Card>
      )
      expect(screen.queryByText(childText)).toBeNull()
    })
  })

  describe('basic variant', () => {
    it('renders title and subtitle', () => {
      render(<Card title={title} subtitle={subtitle} variant="basic" />)
      expect(screen.getByText(title)).toBeTruthy()
      expect(screen.getByText(subtitle)).toBeTruthy()
    })

    it('omits children', () => {
      render(
        <Card title={title} subtitle={subtitle} variant="basic">
          <Text>{childText}</Text>
        </Card>
      )
      expect(screen.queryByText(childText)).toBeNull()
    })
  })

  describe('detailed variant', () => {
    it('renders title, subtitle, and children', () => {
      render(
        <Card title={title} subtitle={subtitle} variant="detailed">
          <Text>{childText}</Text>
        </Card>
      )
      expect(screen.getByText(title)).toBeTruthy()
      expect(screen.getByText(subtitle)).toBeTruthy()
      expect(screen.getByText(childText)).toBeTruthy()
    })
  })

  describe('backward compatibility', () => {
    it('renders with all existing props without variant', () => {
      const onPress = jest.fn()
      render(
        <Card
          title={title}
          subtitle={subtitle}
          onPress={onPress}
          className="custom-class"
        >
          <Text>{childText}</Text>
        </Card>
      )
      expect(screen.getByText(title)).toBeTruthy()
      expect(screen.getByText(subtitle)).toBeTruthy()
      // children omitted in basic (default) variant
      expect(screen.queryByText(childText)).toBeNull()
    })

    it('onPress makes the card pressable', () => {
      const onPress = jest.fn()
      render(<Card title={title} subtitle={subtitle} onPress={onPress} />)
      fireEvent.press(screen.getByText(title))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })
})
