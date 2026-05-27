/**
 * Property-Based Tests: Invalid Variant Fallback
 *
 * **Property 2: Invalid variant falls back to basic**
 * For any string value that is not one of 'compact', 'basic', or 'detailed',
 * the Card SHALL render with the same content slot visibility and visual
 * density as the `basic` variant.
 *
 * **Validates: Requirements 1.3**
 */

import { Card } from '@/src/components/Card'
import { render, screen } from '@testing-library/react-native'
import * as fc from 'fast-check'
import React from 'react'
import { Text } from 'react-native'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const VALID_VARIANTS = ['compact', 'basic', 'detailed']

/** Generates an arbitrary string that is NOT a valid variant */
const invalidVariantArb = fc.string().filter((s) => !VALID_VARIANTS.includes(s))

/** Generates a non-empty string suitable for title/subtitle text */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0)

// ---------------------------------------------------------------------------
// Property 2: Invalid variant falls back to basic
// **Validates: Requirements 1.3**
// ---------------------------------------------------------------------------

describe('Property 2: Invalid variant falls back to basic', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('any invalid variant string renders with basic behavior (title + subtitle visible, children hidden)', () => {
    fc.assert(
      fc.property(
        invalidVariantArb,
        nonEmptyStringArb,
        nonEmptyStringArb,
        nonEmptyStringArb,
        (invalidVariant, title, subtitle, childText) => {
          const { unmount } = render(
            <Card
              title={title}
              subtitle={subtitle}
              variant={invalidVariant as any}
            >
              <Text testID="child-content">{childText}</Text>
            </Card>
          )

          // Basic behavior: title is rendered
          expect(screen.getByText(title)).toBeTruthy()
          // Basic behavior: subtitle is rendered
          expect(screen.getByText(subtitle)).toBeTruthy()
          // Basic behavior: children are NOT rendered
          expect(screen.queryByText(childText)).toBeNull()

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
