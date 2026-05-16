/**
 * Property-Based Tests: Data Serialization Round-Trip
 *
 * **Property 10: Data Serialization Round-Trip** — for any valid Plant, Garden,
 * CalendarEvent, or Photo, JSON.parse(JSON.stringify(obj)) produces a
 * structurally equivalent object.
 *
 * **Validates: Requirements 10.1, 10.2**
 */
import type { ICalendarEvent } from '@/src/types/TCalendar'
import type { IGarden } from '@/src/types/TGarden'
import type { IPhoto } from '@/src/types/TPhoto'
import type { IPlant } from '@/src/types/TPlant'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Arbitraries — smart generators constrained to valid input space
// ---------------------------------------------------------------------------

/** Generates a valid UUID v4 string */
const uuidArb = fc.uuid()

/** Generates a valid ISO 8601 datetime string using integer timestamps to avoid Invalid Date */
const isoDateTimeArb = fc
  .integer({
    min: new Date('2000-01-01T00:00:00.000Z').getTime(),
    max: new Date('2099-12-31T23:59:59.999Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString())

/** Generates a valid ISO 8601 date-only string (YYYY-MM-DD) */
const isoDateArb = fc
  .integer({
    min: new Date('2000-01-01T00:00:00.000Z').getTime(),
    max: new Date('2099-12-31T23:59:59.999Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString().slice(0, 10))

/** Generates a non-empty string of 1–100 characters */
const nameFieldArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0)

/** Generates a valid Plant object */
const plantArb: fc.Arbitrary<IPlant> = fc.record({
  id: uuidArb,
  name: fc.option(nameFieldArb, { nil: undefined }),
  species: fc.option(nameFieldArb, { nil: undefined }),
  variety: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
    nil: undefined,
  }),
  gardenId: uuidArb,
  createdAt: isoDateTimeArb,
  updatedAt: isoDateTimeArb,
}) as fc.Arbitrary<IPlant>

/** Valid garden type values */
const gardenTypeArb = fc.constantFrom(
  'raised_bed' as const,
  'in_ground' as const,
  'container' as const,
  'greenhouse' as const,
  'other' as const
)

/** Generates a valid Garden object */
const gardenArb: fc.Arbitrary<IGarden> = fc.record({
  id: uuidArb,
  name: nameFieldArb,
  type: gardenTypeArb,
  size: fc.string({ minLength: 1, maxLength: 50 }),
  dimensions: fc.record({
    widthInches: fc.integer({ min: 1, max: 1200 }),
    heightInches: fc.integer({ min: 1, max: 1200 }),
  }),
  createdAt: isoDateTimeArb,
  updatedAt: isoDateTimeArb,
})

/** Valid event type values */
const eventTypeArb = fc.constantFrom(
  'planted' as const,
  'fertilized' as const,
  'harvested' as const,
  'watered' as const,
  'pruned' as const,
  'custom' as const
)

/** Generates a valid CalendarEvent object */
const calendarEventArb: fc.Arbitrary<ICalendarEvent> = fc.record({
  id: uuidArb,
  plantId: uuidArb,
  gardenId: fc.option(uuidArb, { nil: undefined }),
  eventType: eventTypeArb,
  date: isoDateArb,
  notes: fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
    nil: undefined,
  }),
  createdAt: isoDateTimeArb,
  updatedAt: isoDateTimeArb,
}) as fc.Arbitrary<ICalendarEvent>

/** Generates a valid Photo object */
const photoArb: fc.Arbitrary<IPhoto> = fc.record({
  id: uuidArb,
  gardenId: fc.option(uuidArb, { nil: undefined }),
  plantId: fc.option(uuidArb, { nil: undefined }),
  localUri: fc
    .string({ minLength: 1, maxLength: 100 })
    .map((s) => `file://${s}`),
  s3Key: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: undefined,
  }),
  takenAt: isoDateTimeArb,
  caption: fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
    nil: undefined,
  }),
}) as fc.Arbitrary<IPhoto>

// ---------------------------------------------------------------------------
// Property 10: Data Serialization Round-Trip
// **Validates: Requirements 10.1, 10.2**
// ---------------------------------------------------------------------------

describe('Property 10: Data Serialization Round-Trip', () => {
  it('Plant: JSON.parse(JSON.stringify(plant)) produces a structurally equivalent object', () => {
    fc.assert(
      fc.property(plantArb, (plant) => {
        const serialized = JSON.stringify(plant)
        const deserialized = JSON.parse(serialized)

        // Structurally equivalent: all defined keys match
        expect(deserialized.id).toBe(plant.id)
        expect(deserialized.gardenId).toBe(plant.gardenId)
        expect(deserialized.createdAt).toBe(plant.createdAt)
        expect(deserialized.updatedAt).toBe(plant.updatedAt)

        // Optional fields: present if defined, absent if undefined
        if (plant.name !== undefined) {
          expect(deserialized.name).toBe(plant.name)
        }
        if (plant.species !== undefined) {
          expect(deserialized.species).toBe(plant.species)
        }
        if (plant.variety !== undefined) {
          expect(deserialized.variety).toBe(plant.variety)
        } else {
          expect(deserialized.variety).toBeUndefined()
        }
      }),
      { numRuns: 200 }
    )
  })

  it('Garden: JSON.parse(JSON.stringify(garden)) produces a structurally equivalent object', () => {
    fc.assert(
      fc.property(gardenArb, (garden) => {
        const serialized = JSON.stringify(garden)
        const deserialized = JSON.parse(serialized)

        expect(deserialized.id).toBe(garden.id)
        expect(deserialized.name).toBe(garden.name)
        expect(deserialized.type).toBe(garden.type)
        expect(deserialized.size).toBe(garden.size)
        expect(deserialized.dimensions.widthInches).toBe(
          garden.dimensions.widthInches
        )
        expect(deserialized.dimensions.heightInches).toBe(
          garden.dimensions.heightInches
        )
        expect(deserialized.createdAt).toBe(garden.createdAt)
        expect(deserialized.updatedAt).toBe(garden.updatedAt)
      }),
      { numRuns: 200 }
    )
  })

  it('CalendarEvent: JSON.parse(JSON.stringify(event)) produces a structurally equivalent object', () => {
    fc.assert(
      fc.property(calendarEventArb, (event) => {
        const serialized = JSON.stringify(event)
        const deserialized = JSON.parse(serialized)

        expect(deserialized.id).toBe(event.id)
        expect(deserialized.plantId).toBe(event.plantId)
        expect(deserialized.eventType).toBe(event.eventType)
        expect(deserialized.date).toBe(event.date)
        expect(deserialized.createdAt).toBe(event.createdAt)
        expect(deserialized.updatedAt).toBe(event.updatedAt)

        // Optional fields
        if (event.gardenId !== undefined) {
          expect(deserialized.gardenId).toBe(event.gardenId)
        } else {
          expect(deserialized.gardenId).toBeUndefined()
        }
        if (event.notes !== undefined) {
          expect(deserialized.notes).toBe(event.notes)
        } else {
          expect(deserialized.notes).toBeUndefined()
        }
      }),
      { numRuns: 200 }
    )
  })

  it('Photo: JSON.parse(JSON.stringify(photo)) produces a structurally equivalent object', () => {
    fc.assert(
      fc.property(photoArb, (photo) => {
        const serialized = JSON.stringify(photo)
        const deserialized = JSON.parse(serialized)

        expect(deserialized.id).toBe(photo.id)
        expect(deserialized.localUri).toBe(photo.localUri)
        expect(deserialized.takenAt).toBe(photo.takenAt)

        // Optional fields
        if (photo.gardenId !== undefined) {
          expect(deserialized.gardenId).toBe(photo.gardenId)
        } else {
          expect(deserialized.gardenId).toBeUndefined()
        }
        if (photo.plantId !== undefined) {
          expect(deserialized.plantId).toBe(photo.plantId)
        } else {
          expect(deserialized.plantId).toBeUndefined()
        }
        if (photo.s3Key !== undefined) {
          expect(deserialized.s3Key).toBe(photo.s3Key)
        } else {
          expect(deserialized.s3Key).toBeUndefined()
        }
        if (photo.caption !== undefined) {
          expect(deserialized.caption).toBe(photo.caption)
        } else {
          expect(deserialized.caption).toBeUndefined()
        }
      }),
      { numRuns: 200 }
    )
  })

  it('all types: deep equality holds after round-trip for objects without undefined values', () => {
    // When all optional fields are present (no undefined), JSON round-trip
    // should produce a deeply equal object
    const fullPlantArb = fc.record({
      id: uuidArb,
      name: nameFieldArb,
      species: nameFieldArb,
      variety: fc.string({ minLength: 1, maxLength: 100 }),
      gardenId: uuidArb,
      createdAt: isoDateTimeArb,
      updatedAt: isoDateTimeArb,
    })

    fc.assert(
      fc.property(fullPlantArb, (plant) => {
        const deserialized = JSON.parse(JSON.stringify(plant))
        expect(deserialized).toEqual(plant)
      }),
      { numRuns: 100 }
    )
  })
})
