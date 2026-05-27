/**
 * Property-Based Tests: Card Variant Content Slot Visibility
 *
 * **Property 1: Variant controls content slot visibility**
 * For any valid Card props (title, subtitle, children) and for any variant
 * value in ['compact', 'basic', 'detailed']:
 * - If variant is `compact`, the rendered output contains only the title
 *   (subtitle and children are absent)
 * - If variant is `basic`, the rendered output contains the title and subtitle
 *   (children are absent)
 * - If variant is `detailed`, the rendered output contains the title, subtitle,
 *   and children
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1**
 */

import { Card } from '@/src/components/Card'
import type { CardVariant } from '@/src/types/TCard'
import { render, screen } from '@testing-library/react-native'
import * as fc from 'fast-check'
import React from 'react'
import { Text } from 'react-native'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a non-empty string suitable for title/subtitle text */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)

/** Generates a variant value from the valid set */
const variantArb = fc.constantFrom<CardVariant>('compact', 'basic', 'detailed')

// ---------------------------------------------------------------------------
// Property 1: Variant controls content slot visibility
// **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1**
// ---------------------------------------------------------------------------

describe('Property 1: Variant controls content slot visibility', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('compact variant renders only title, omits subtitle and children', () => {
    const distinctStringsArb = fc
      .tuple(nonEmptyStringArb, nonEmptyStringArb, nonEmptyStringArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c)

    fc.assert(
      fc.property(distinctStringsArb, ([title, subtitle, childText]) => {
        const { unmount } = render(
          <Card title={title} subtitle={subtitle} variant="compact">
            <Text testID="child-content">{childText}</Text>
          </Card>
        )

        // Title should be present
        expect(screen.getByText(title)).toBeTruthy()
        // Subtitle should be absent
        expect(screen.queryByText(subtitle)).toBeNull()
        // Children should be absent
        expect(screen.queryByText(childText)).toBeNull()

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('basic variant renders title and subtitle, omits children', () => {
    const distinctStringsArb = fc
      .tuple(nonEmptyStringArb, nonEmptyStringArb, nonEmptyStringArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c)

    fc.assert(
      fc.property(distinctStringsArb, ([title, subtitle, childText]) => {
        const { unmount } = render(
          <Card title={title} subtitle={subtitle} variant="basic">
            <Text testID="child-content">{childText}</Text>
          </Card>
        )

        // Title should be present
        expect(screen.getByText(title)).toBeTruthy()
        // Subtitle should be present
        expect(screen.getByText(subtitle)).toBeTruthy()
        // Children should be absent
        expect(screen.queryByText(childText)).toBeNull()

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('detailed variant renders title, subtitle, and children', () => {
    const distinctStringsArb = fc
      .tuple(nonEmptyStringArb, nonEmptyStringArb, nonEmptyStringArb)
      .filter(([a, b, c]) => a !== b && b !== c && a !== c)

    fc.assert(
      fc.property(distinctStringsArb, ([title, subtitle, childText]) => {
        const { unmount } = render(
          <Card title={title} subtitle={subtitle} variant="detailed">
            <Text testID="child-content">{childText}</Text>
          </Card>
        )

        // Title should be present
        expect(screen.getByText(title)).toBeTruthy()
        // Subtitle should be present
        expect(screen.getByText(subtitle)).toBeTruthy()
        // Children should be present
        expect(screen.getByText(childText)).toBeTruthy()

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  xit('for any variant, content slot visibility follows the variant rules', () => {
    fc.assert(
      fc.property(variantArb, nonEmptyStringArb, nonEmptyStringArb, nonEmptyStringArb, (variant, title, subtitle, childText) => {
        const { unmount } = render(
          <Card title={title} subtitle={subtitle} variant={variant}>
            <Text testID="child-content">{childText}</Text>
          </Card>
        )

        // Title is always rendered regardless of variant
        expect(screen.getByText(title)).toBeTruthy()

        // Subtitle visibility depends on variant
        if (variant === 'compact') {
          expect(screen.queryByText(subtitle)).toBeNull()
        } else {
          expect(screen.getByText(subtitle)).toBeTruthy()
        }

        // Children visibility depends on variant
        if (variant === 'detailed') {
          expect(screen.getByText(childText)).toBeTruthy()
        } else {
          expect(screen.queryByText(childText)).toBeNull()
        }

        unmount()
      }),
      { numRuns: 100 }
    )
  })
})
