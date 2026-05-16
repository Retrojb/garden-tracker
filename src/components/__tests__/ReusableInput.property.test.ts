/**
 * Property-Based Tests: Phone Formatting
 *
 * **Property 1: Phone Format Round-Trip Stability**
 * For any digit string `d` where `d.length <= 10`,
 * `stripNonDigits(formatPhoneNumber(d)) === d`.
 *
 * Formatting and then stripping produces the original digit string —
 * the formatting function never adds, removes, or reorders digits.
 *
 * **Validates: Requirements 10.1, 2.2**
 *
 * **Property 2: Phone Format Output Validity**
 * For any input string `s`, `formatPhoneNumber(s).length <= 14`
 * and the output contains only characters from the set `[0-9() -]`.
 *
 * **Validates: Requirements 10.2, 10.3**
 */

import * as fc from 'fast-check'
import { formatPhoneNumber, stripNonDigits } from '../ReusableInput'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a digit-only string of length 1–10 */
const digitStringArb = fc.stringOf(
  fc.constantFrom(...'0123456789'),
  { minLength: 1, maxLength: 10 }
)

// ---------------------------------------------------------------------------
// Property 1: Phone Format Round-Trip Stability
// **Validates: Requirements 10.1, 2.2**
// ---------------------------------------------------------------------------

describe('Property 1: Phone Format Round-Trip Stability', () => {
  it('for any digit string d (1–10 chars), stripNonDigits(formatPhoneNumber(d)) === d', () => {
    fc.assert(
      fc.property(digitStringArb, (d) => {
        const formatted = formatPhoneNumber(d)
        const roundTripped = stripNonDigits(formatted)

        expect(roundTripped).toBe(d)
      }),
      { numRuns: 1000 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Phone Format Output Validity
// **Validates: Requirements 10.2, 10.3**
// ---------------------------------------------------------------------------

describe('Property 2: Phone Format Output Validity', () => {
  it('for any input string s, formatPhoneNumber(s).length <= 14', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const output = formatPhoneNumber(s)

        expect(output.length).toBeLessThanOrEqual(14)
      }),
      { numRuns: 1000 }
    )
  })

  it('for any input string s, formatPhoneNumber(s) contains only digits, parentheses, spaces, and hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const output = formatPhoneNumber(s)

        if (output.length > 0) {
          expect(output).toMatch(/^[0-9() -]+$/)
        }
      }),
      { numRuns: 1000 }
    )
  })
})


// ---------------------------------------------------------------------------
// Property 4: Password Toggle Idempotency
// **Validates: Requirements 3.2, 3.3**
// ---------------------------------------------------------------------------

describe('Property 4: Password Toggle Idempotency', () => {
  it('for any boolean state s, applying toggle twice returns original: toggle(toggle(s)) === s', () => {
    fc.assert(
      fc.property(fc.boolean(), (s) => {
        const toggledOnce = togglePasswordVisibility(s)
        const toggledTwice = togglePasswordVisibility(toggledOnce)

        expect(toggledTwice).toBe(s)
      }),
      { numRuns: 1000 }
    )
  })
})
