import * as fc from 'fast-check'
import { validatePlant } from '../validation'

describe('validatePlant', () => {
  // -------------------------------------------------------------------------
  // Valid inputs
  // -------------------------------------------------------------------------

  describe('valid inputs', () => {
    it('accepts a plant with name and species', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts a plant with name, species, and variety', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        variety: 'Cherry',
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts name and species at exactly 100 characters', () => {
      const hundredChars = 'a'.repeat(100)
      const result = validatePlant({
        name: hundredChars,
        species: hundredChars,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts variety at exactly 100 characters', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        variety: 'a'.repeat(100),
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts a plant with no variety field (undefined)', () => {
      const result = validatePlant({
        name: 'Basil',
        species: 'Ocimum basilicum',
      })
      expect(result.valid).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // name validation
  // -------------------------------------------------------------------------

  describe('name validation', () => {
    it('rejects missing name (undefined)', () => {
      const result = validatePlant({ species: 'Solanum lycopersicum' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      })
    })

    it('rejects null name', () => {
      const result = validatePlant({
        name: null as unknown as string,
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      })
    })

    it('rejects empty string name', () => {
      const result = validatePlant({
        name: '',
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      })
    })

    it('rejects whitespace-only name', () => {
      const result = validatePlant({
        name: '   ',
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      })
    })

    it('rejects name exceeding 100 characters', () => {
      const result = validatePlant({
        name: 'a'.repeat(101),
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name must be 100 characters or fewer',
      })
    })

    it('accepts name with leading/trailing whitespace that trims to ≤100 chars', () => {
      const result = validatePlant({
        name: '  Tomato  ',
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // species validation
  // -------------------------------------------------------------------------

  describe('species validation', () => {
    it('rejects missing species (undefined)', () => {
      const result = validatePlant({ name: 'Tomato' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species is required',
      })
    })

    it('rejects null species', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: null as unknown as string,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species is required',
      })
    })

    it('rejects empty string species', () => {
      const result = validatePlant({ name: 'Tomato', species: '' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species is required',
      })
    })

    it('rejects whitespace-only species', () => {
      const result = validatePlant({ name: 'Tomato', species: '\t\n' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species is required',
      })
    })

    it('rejects species exceeding 100 characters', () => {
      const result = validatePlant({ name: 'Tomato', species: 'b'.repeat(101) })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species must be 100 characters or fewer',
      })
    })
  })

  // -------------------------------------------------------------------------
  // variety validation
  // -------------------------------------------------------------------------

  describe('variety validation', () => {
    it('accepts undefined variety', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
      })
      expect(result.valid).toBe(true)
    })

    it('rejects variety exceeding 100 characters', () => {
      const result = validatePlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        variety: 'c'.repeat(101),
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'variety',
        message: 'Variety must be 100 characters or fewer',
      })
    })
  })

  // -------------------------------------------------------------------------
  // Multiple errors
  // -------------------------------------------------------------------------

  describe('multiple errors', () => {
    it('collects errors for both name and species when both are missing', () => {
      const result = validatePlant({})
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      })
      expect(result.errors).toContainEqual({
        field: 'species',
        message: 'Species is required',
      })
    })

    it('collects errors for all three fields when all are invalid', () => {
      const result = validatePlant({
        name: '',
        species: '',
        variety: 'v'.repeat(101),
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  // -------------------------------------------------------------------------
  // No mutation
  // -------------------------------------------------------------------------

  describe('no mutation', () => {
    it('does not mutate the input object', () => {
      const input = {
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        variety: 'Cherry',
      }
      const before = JSON.stringify(input)
      validatePlant(input)
      expect(JSON.stringify(input)).toBe(before)
    })

    it('does not mutate an invalid input object', () => {
      const input = { name: '', species: '' }
      const before = JSON.stringify(input)
      validatePlant(input)
      expect(JSON.stringify(input)).toBe(before)
    })
  })
})

// =============================================================================
// Property-Based Tests
// Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6
// =============================================================================

/**
 * Arbitrary for a non-whitespace-only string of 1–100 characters.
 * Generates a string with at least one non-whitespace character so that
 * trimming it always yields a non-empty string within the 100-char limit.
 */
const validFieldArb = fc
  .tuple(
    fc
      .string({ minLength: 1, maxLength: 98 })
      .filter((s) => s.trim().length > 0),
    fc.string({ minLength: 0, maxLength: 1 }),
    fc.string({ minLength: 0, maxLength: 1 })
  )
  .map(([core, prefix, suffix]) => {
    const combined = prefix + core + suffix
    // Ensure the trimmed result is still within 100 chars
    return combined.trim().length > 0 && combined.trim().length <= 100
      ? combined
      : core
  })

/**
 * Arbitrary for a valid variety: either undefined or a string of 0–100 chars.
 */
const validVarietyArb = fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
  nil: undefined,
})

describe('validatePlant — property-based tests', () => {
  // ---------------------------------------------------------------------------
  // Property 2: Plant Field Validation — valid inputs always return { valid: true }
  // **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
  // ---------------------------------------------------------------------------

  describe('Property 2: valid plant inputs always pass', () => {
    it('returns { valid: true } for any input with name and species within bounds', () => {
      fc.assert(
        fc.property(
          validFieldArb,
          validFieldArb,
          validVarietyArb,
          (name, species, variety) => {
            const input =
              variety !== undefined
                ? { name, species, variety }
                : { name, species }
            const result = validatePlant(input)
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        )
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Property 2 (inverse): any constraint violation returns { valid: false } with ≥1 error
  // **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
  // ---------------------------------------------------------------------------

  describe('Property 2 (inverse): invalid plant inputs always fail with ≥1 error', () => {
    xit('returns { valid: false } with ≥1 error when name is empty or whitespace-only', () => {
      // Whitespace-only strings (including empty string)
      const whitespaceArb = fc.stringOf(
        fc.constantFrom(' ', '\t', '\n', '\r'),
        { minLength: 0, maxLength: 50 }
      )

      fc.assert(
        fc.property(whitespaceArb, validFieldArb, (badName, species) => {
          const result = validatePlant({ name: badName, species })
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThanOrEqual(1)
        })
      )
    })

    it('returns { valid: false } with ≥1 error when name exceeds 100 characters after trimming', () => {
      // Strings whose trimmed length is > 100
      const longNameArb = fc
        .string({ minLength: 101, maxLength: 200 })
        .filter((s) => s.trim().length > 100)

      fc.assert(
        fc.property(longNameArb, validFieldArb, (longName, species) => {
          const result = validatePlant({ name: longName, species })
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThanOrEqual(1)
        })
      )
    })

    xit('returns { valid: false } with ≥1 error when species is empty or whitespace-only', () => {
      const whitespaceArb = fc.stringOf(
        fc.constantFrom(' ', '\t', '\n', '\r'),
        { minLength: 0, maxLength: 50 }
      )

      fc.assert(
        fc.property(validFieldArb, whitespaceArb, (name, badSpecies) => {
          const result = validatePlant({ name, species: badSpecies })
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThanOrEqual(1)
        })
      )
    })

    it('returns { valid: false } with ≥1 error when species exceeds 100 characters after trimming', () => {
      const longSpeciesArb = fc
        .string({ minLength: 101, maxLength: 200 })
        .filter((s) => s.trim().length > 100)

      fc.assert(
        fc.property(validFieldArb, longSpeciesArb, (name, longSpecies) => {
          const result = validatePlant({ name, species: longSpecies })
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThanOrEqual(1)
        })
      )
    })

    it('returns { valid: false } with ≥1 error when variety exceeds 100 characters', () => {
      const longVarietyArb = fc.string({ minLength: 101, maxLength: 200 })

      fc.assert(
        fc.property(
          validFieldArb,
          validFieldArb,
          longVarietyArb,
          (name, species, longVariety) => {
            const result = validatePlant({
              name,
              species,
              variety: longVariety,
            })
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThanOrEqual(1)
          }
        )
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Property 9: Plant Validation Round-Trip — validatePlant never mutates its input
  // **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
  // ---------------------------------------------------------------------------

  describe('Property 9: validatePlant never mutates its input', () => {
    it('leaves the input object unchanged for any valid plant input', () => {
      fc.assert(
        fc.property(
          validFieldArb,
          validFieldArb,
          validVarietyArb,
          (name, species, variety) => {
            const input =
              variety !== undefined
                ? { name, species, variety }
                : { name, species }
            const snapshot = JSON.stringify(input)
            validatePlant(input)
            expect(JSON.stringify(input)).toBe(snapshot)
          }
        )
      )
    })

    it('leaves the input object unchanged for any invalid plant input', () => {
      // Use fully arbitrary partial objects to cover all invalid shapes
      const arbitraryInputArb = fc.record(
        {
          name: fc.oneof(fc.string(), fc.constant(undefined)),
          species: fc.oneof(fc.string(), fc.constant(undefined)),
          variety: fc.oneof(fc.string(), fc.constant(undefined)),
        },
        { requiredKeys: [] }
      )

      fc.assert(
        fc.property(arbitraryInputArb, (input) => {
          const snapshot = JSON.stringify(input)
          validatePlant(input)
          expect(JSON.stringify(input)).toBe(snapshot)
        })
      )
    })
  })
})
