# Implementation Plan: Garden Detail Layout

## Overview

Build the garden detail screen at `app/gardens/[id].tsx` with a heading card (garden name), a wrapping row of compact plant cards, an empty state, and a `usePlants` hook following the Zustand + MMKV pattern. Implementation uses TypeScript with React Native and Expo Router.

## Tasks

- [x] 1. Define types and update IPlant interface
  - [x] 1.1 Add `gardenId` field to IPlant interface
    - Add `gardenId: string` to the existing `IPlant` interface in `src/types/TPlant.ts`
    - _Requirements: 4.1_

  - [x] 1.2 Create IPlantRowProps type
    - Create `src/types/TPlantRow.ts` with `IPlantRowProps` interface containing `plants: IPlant[]` and `className?: string`
    - Use named export pattern: `export type { IPlantRowProps }`
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 Create IEmptyStateProps type
    - Create `src/types/TEmptyState.ts` with `IEmptyStateProps` interface containing `message: string`, `onAdd?: () => void`, and `className?: string`
    - Use named export pattern: `export type { IEmptyStateProps }`
    - _Requirements: 5.1, 5.2_

  - [x] 1.4 Create UsePlantsResult type
    - Create `src/types/TUsePlants.ts` with `UsePlantsResult` interface containing `plants: IPlant[]`, `isLoading: boolean`, `error: Error | null`, and `refreshPlants: () => Promise<void>`
    - Use named export pattern: `export type { UsePlantsResult }`
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 2. Implement usePlants hook
  - [x] 2.1 Create usePlants hook with Zustand store and MMKV caching
    - Create `src/hooks/usePlants.ts` following the same Zustand + MMKV pattern as `useGardens`
    - Accept `gardenId` parameter, filter plants by `gardenId` field
    - Implement `refreshPlants` that fetches from `API_ROUTES.PLANTS?gardenId=<id>` and filters results
    - Cache fetched data in MMKV with key `plants_cache_${gardenId}`
    - Serve from cache on fetch failure (offline support)
    - Expose `plants`, `isLoading`, `error`, `refreshPlants`
    - Use named export: `export { usePlants }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2_

  - [x] 2.2 Write property test for garden ID filtering (Property 4)
    - **Property 4: Garden ID filtering returns only matching plants**
    - Generate arrays of plants with various gardenId values; verify `usePlants(targetId)` returns only plants whose `gardenId === targetId`
    - **Validates: Requirements 3.1, 4.2**

  - [ ]* 2.3 Write property test for cache round-trip (Property 5)
    - **Property 5: Cache round-trip for offline access**
    - Generate plant arrays, cache them, simulate offline, verify same data returned without mutation
    - **Validates: Requirements 3.3, 3.6**

  - [ ]* 2.4 Write property test for error state propagation (Property 6)
    - **Property 6: Error state propagation**
    - Generate error scenarios, verify `error` state contains Error object and `plants` remains unchanged
    - **Validates: Requirements 3.5**

- [~] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement UI components
  - [x] 4.1 Create PlantRow component
    - Create `src/components/PlantRow.tsx` with a flex-wrap View container
    - Render one `Card` with `variant="compact"` per plant, using `plant.name` as title
    - Accept `className` prop for style extension
    - Use named export and function signature: `const PlantRow = ({ plants, className }: IPlantRowProps) => {}; export { PlantRow };`
    - Apply responsive classes for mobile, tablet, and web viewports
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.2 Write property test for plant count invariant (Property 2)
    - **Property 2: Plant count invariant**
    - Generate arrays of N plants (N > 0), verify PlantRow renders exactly N Card components
    - **Validates: Requirements 2.1**

  - [ ]* 4.3 Write property test for plant card title (Property 3)
    - **Property 3: Plant card title reflects plant name**
    - Generate plant objects with name fields, verify each Card title prop equals the plant's name
    - **Validates: Requirements 2.4**

  - [x] 4.4 Create EmptyState component
    - Create `src/components/EmptyState.tsx` with centered layout
    - Display `message` prop as gray text
    - Conditionally render an "Add Plant" button when `onAdd` is provided
    - Accept `className` prop for style extension
    - Use named export and function signature: `const EmptyState = ({ message, onAdd, className }: IEmptyStateProps) => {}; export { EmptyState };`
    - _Requirements: 5.1, 5.2_

  - [x] 4.5 Write unit tests for PlantRow component
    - Test flex-wrap layout className is applied
    - Test Card renders with `variant="compact"`
    - Test responsive classes are present
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ]* 4.6 Write unit tests for EmptyState component
    - Test message text renders correctly
    - Test add button renders when `onAdd` is provided
    - Test add button does not render when `onAdd` is undefined
    - _Requirements: 5.1, 5.2_

- [x] 5. Wire up GardenDetailScreen
  - [x] 5.1 Rewrite GardenDetailScreen with hooks and components
    - Replace the existing placeholder in `app/gardens/[id].tsx`
    - Import and use `useGardens` to find garden by ID for the heading
    - Import and use `usePlants(id)` for plant data
    - Render `ActivityIndicator` when either hook is loading
    - Render `Card` with `variant="basic"` and garden name as title for the heading
    - Render `PlantRow` when plants exist
    - Render `EmptyState` with message "No plants yet" when plants is empty and not loading
    - Suppress EmptyState while loading
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 5.1, 5.2, 5.3_

  - [ ]* 5.2 Write property test for heading card title (Property 1)
    - **Property 1: Heading card title reflects garden name**
    - Generate garden objects with non-empty names, verify Card title prop equals garden name
    - **Validates: Requirements 1.1**

  - [ ]* 5.3 Write unit tests for GardenDetailScreen
    - Test loading indicator renders when data is loading
    - Test heading Card uses `variant="basic"`
    - Test EmptyState is not shown while loading
    - Test EmptyState is shown when plants array is empty and not loading
    - Test PlantRow renders when plants exist
    - _Requirements: 1.2, 1.3, 5.3_

- [~] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- DO NOT execute unit tests per workspace rules — tests are written but not run as part of this workflow

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "4.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "4.1", "4.6"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.5"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] }
  ]
}
```
