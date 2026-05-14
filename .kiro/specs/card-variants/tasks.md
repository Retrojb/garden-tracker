# Implementation Plan: Card Variants

## Overview

Add a `variant` prop (`'compact' | 'basic' | 'detailed'`) to the existing Card component that controls content slot visibility and visual density. The implementation uses the existing `tailwind-variants` slot-based API with a `variants` configuration. The `basic` variant preserves current behavior, making this non-breaking.

## Tasks

- [x] 1. Extract Card types to dedicated type file
  - [x] 1.1 Create `src/types/TCard.ts` with `CardVariant` and `ICardProps` types
    - Define `CardVariant` as `'compact' | 'basic' | 'detailed'`
    - Define `ICardProps` with existing props (title, subtitle, children, onPress) plus new `className` and `variant` props
    - Export both types as named type exports
    - _Requirements: 9.1, 9.2_

- [x] 2. Update Card component with variant support
  - [x] 2.1 Refactor `src/components/Card.tsx` to import types from `@/src/types/TCard`
    - Remove inline `ICardProps` type definition
    - Import `ICardProps` and `CardVariant` from the new type file
    - _Requirements: 9.2_

  - [x] 2.2 Add `variants` configuration to the `tv()` call in Card
    - Add `variants.variant` object with `compact` (`p-2`), `basic` (`p-4 min-h-[200px]`), and `detailed` (`p-6 min-h-[280px]`) entries
    - Remove `p-4` and `min-h-[200px]` from the base slot (moved into variant config)
    - Add `defaultVariants: { variant: 'basic' }`
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 10.1_

  - [x] 2.3 Add `resolveVariant` helper and conditional rendering logic
    - Implement `resolveVariant` function that validates the variant prop and falls back to `'basic'` for invalid values
    - Add `VALID_VARIANTS` array for runtime validation
    - Conditionally render subtitle only when variant is not `compact`
    - Conditionally render children only when variant is `detailed`
    - Pass `className` prop through to the base slot via `base({ className })`
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 8.1, 8.2, 10.2_

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write tests for Card variants
  - [x] 4.1 Write unit tests for Card variant rendering
    - Verify default (no variant prop) renders title and subtitle, omits children (`basic` behavior)
    - Verify `compact` renders only title, omits subtitle and children
    - Verify `basic` renders title and subtitle, omits children
    - Verify `detailed` renders title, subtitle, and children
    - Verify backward compatibility: existing props (title, subtitle, children, onPress) work without variant
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 8.1, 8.2_

  - [ ]* 4.2 Write property test for content slot visibility
    - **Property 1: Variant controls content slot visibility**
    - For any valid Card props and each variant, verify correct slots are rendered/omitted
    - Use `fast-check` to generate random title, subtitle, and children values
    - **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1**

  - [ ]* 4.3 Write property test for invalid variant fallback
    - **Property 2: Invalid variant falls back to basic**
    - For any string not in `['compact', 'basic', 'detailed']`, verify Card renders with `basic` behavior
    - Use `fast-check` arbitrary strings
    - **Validates: Requirements 1.3**

  - [ ]* 4.4 Write property test for className passthrough
    - **Property 3: className is applied regardless of variant**
    - For any variant and any non-empty className, verify className appears in the base container's class list
    - **Validates: Requirements 10.2**

- [ ] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript with Jest + @testing-library/react-native and fast-check for property tests
- Follow workspace conventions: named exports, `const fn = () => {}; export { fn };` pattern
- DO NOT execute unit tests per workspace rules

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4"] }
  ]
}
```
