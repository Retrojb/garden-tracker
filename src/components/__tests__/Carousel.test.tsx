import { Carousel } from '@/src/components/Carousel'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Carousel', () => {
  it('renders the title', () => {
    render(
      <Carousel title="My Gardens">
        <Text>Item 1</Text>
      </Carousel>
    )
    expect(screen.getByText('My Gardens')).toBeTruthy()
  })

  it('renders children inside the scroll view', () => {
    render(
      <Carousel title="My Plants">
        <Text>Tomato</Text>
        <Text>Basil</Text>
      </Carousel>
    )
    expect(screen.getByText('Tomato')).toBeTruthy()
    expect(screen.getByText('Basil')).toBeTruthy()
  })

  it('renders the "See all" button when onSeeAll is provided', () => {
    const onSeeAll = jest.fn()
    render(
      <Carousel title="My Gardens" onSeeAll={onSeeAll}>
        <Text>Item</Text>
      </Carousel>
    )
    expect(screen.getByText('See all')).toBeTruthy()
  })

  it('does not render the "See all" button when onSeeAll is omitted', () => {
    render(
      <Carousel title="My Gardens">
        <Text>Item</Text>
      </Carousel>
    )
    expect(screen.queryByText('See all')).toBeNull()
  })

  it('calls onSeeAll when "See all" is pressed', () => {
    const onSeeAll = jest.fn()
    render(
      <Carousel title="My Gardens" onSeeAll={onSeeAll}>
        <Text>Item</Text>
      </Carousel>
    )
    fireEvent.press(screen.getByText('See all'))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })

  it('shows the empty message when isEmpty is true', () => {
    render(
      <Carousel
        title="My Gardens"
        isEmpty={true}
        emptyMessage="No gardens yet. Add one to get started."
      >
        <Text>Should not appear</Text>
      </Carousel>
    )
    expect(screen.getByText(/No gardens yet/i)).toBeTruthy()
    expect(screen.queryByText('Should not appear')).toBeNull()
  })

  it('renders children when isEmpty is false', () => {
    render(
      <Carousel
        title="My Plants"
        isEmpty={false}
        emptyMessage="No plants yet."
      >
        <Text>Tomato</Text>
      </Carousel>
    )
    expect(screen.getByText('Tomato')).toBeTruthy()
    expect(screen.queryByText('No plants yet.')).toBeNull()
  })

  it('sets the accessibility label on the scroll view', () => {
    render(
      <Carousel title="My Gardens" accessibilityLabel="Gardens carousel">
        <Text>Item</Text>
      </Carousel>
    )
    expect(screen.getByLabelText('Gardens carousel')).toBeTruthy()
  })

  it('defaults accessibility label from title when not provided', () => {
    render(
      <Carousel title="My Gardens">
        <Text>Item</Text>
      </Carousel>
    )
    expect(screen.getByLabelText('My Gardens carousel')).toBeTruthy()
  })
})
