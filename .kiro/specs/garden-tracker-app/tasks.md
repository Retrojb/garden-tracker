# Implementation Plan: Garden Tracker App

## Overview

Implement the Garden Tracker App as a React Native (Expo) application using TypeScript, Expo Router, Zustand, AWS Amplify (Cognito + API Gateway), DynamoDB, and S3. The plan follows the composite component architecture defined in the design document, building from data models and validation upward through hooks, components, and screens.

## Tasks

- [x] 1. Project setup and core type definitions
  - Install missing dependencies: `zustand`, `zod`, `aws-amplify`, `expo-file-system`, `expo-location`, `expo-sqlite`, `react-native-mmkv`, `react-native-skia`, `react-native-gesture-handler`, `@shopify/flash-list`, `react-native-calendars`, `fast-check`, `jest`, `@testing-library/react-native`, `msw`, `expo-image-manipulator`
  - Create `src/types/index.ts` with all TypeScript interfaces and types: `Plant`, `Garden`, `GardenDimensions`, `GardenType`, `CalendarEvent`, `EventType`, `Photo`, `WeatherResponse`, `WeatherOptions`, `CellState`, `DrawingTool`, `ValidationResult`, `CreateGardenPayload`, `UpdateGardenPayload`, `CreatePlantPayload`, `UpdatePlantPayload`, `CreateEventPayload`, `UpdateEventPayload`
  - Create `src/constants/api.ts` with API endpoint constants and base URL configuration
  - Set up Jest config (`jest.config.js`) and `@testing-library/react-native` with Expo preset
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 10.1_

- [x] 2. Validation utilities
  - [x] 2.1 Implement `validatePlant` in `src/utils/validation.ts`
    - Implement the `validatePlant(input)` algorithm from the design: check `name` (required, 1–100 chars), `species` (required, 1–100 chars), `variety` (optional, max 100 chars)
    - Return `{ valid: true, errors: [] }` or `{ valid: false, errors: [...] }` without mutating input
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Write property tests for `validatePlant`
    - **Property 2: Plant Field Validation** — for any valid plant input all fields within bounds, `validatePlant` returns `{ valid: true }`; for any input violating any constraint, returns `{ valid: false }` with ≥1 error
    - **Property 9: Plant Validation Round-Trip** — `validatePlant` never mutates its input
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

  - [x] 2.3 Implement `validateGarden` in `src/utils/validation.ts`
    - Check `name` (required, 1–100 chars), `type` (must be valid `GardenType`), `dimensions.widthInches` (positive integer, ≤ 1200), `dimensions.heightInches` (positive integer, ≤ 1200)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]\* 2.4 Write property tests for `validateGarden`
    - **Property 1: Garden Dimensions Validity** — any garden with `widthInches > 0 ∧ heightInches > 0 ∧ widthInches ≤ 1200 ∧ heightInches ≤ 1200` passes; any outside those bounds is rejected
    - **Validates: Requirements 2.4, 2.5**

  - [x] 2.5 Implement Zod schemas in `src/utils/schemas.ts` for `Plant`, `Garden`, `CalendarEvent`, and `Photo`
    - Export `plantSchema`, `gardenSchema`, `calendarEventSchema`, `photoSchema` for runtime API payload validation
    - _Requirements: 10.4_

  - [x] 2.6 Write property tests for data serialization round-trip
    - **Property 10: Data Serialization Round-Trip** — for any valid `Plant`, `Garden`, `CalendarEvent`, or `Photo`, `JSON.parse(JSON.stringify(obj))` produces a structurally equivalent object
    - **Validates: Requirements 10.1, 10.2**

- [ ] 3. Checkpoint — Ensure all validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. AWS Amplify auth and API client setup
  - [x] 4.1 Configure AWS Amplify in `src/lib/amplify.ts`
    - Initialize Amplify with Cognito User Pool and API Gateway endpoint from environment/EAS secrets
    - Export typed `apiClient` wrapper (GET, POST, PUT, DELETE) that attaches the Cognito JWT automatically
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.2 Implement token refresh and sign-out logic in `src/lib/auth.ts`
    - Auto-refresh Cognito JWT on expiry; on refresh failure, emit an event that triggers re-authentication prompt
    - Implement `signOut()` that clears all locally cached user data (MMKV + SQLite) and navigates to sign-in
    - _Requirements: 7.2, 7.3, 7.5_

  - [x] 4.3 Write unit tests for sign-out cache clearing
    - **Property 17: Sign-Out Cache Clearing** — after `signOut()`, local cache must be empty; no user-specific data remains
    - **Validates: Requirements 7.5**

- [x] 5. Local storage layer
  - [x] 5.1 Implement MMKV storage helpers in `src/lib/storage.ts`
    - Wrap `react-native-mmkv` with typed `get`, `set`, `delete`, `clear` helpers
    - Implement weather cache helpers: `getCachedWeather(key)`, `setCachedWeather(key, data, timestamp)`
    - _Requirements: 6.4, 6.5, 8.1_

  - [x] 5.2 Implement offline mutation queue in `src/lib/mutationQueue.ts`
    - Store pending create/update/delete mutations in SQLite when offline
    - Implement `enqueue(mutation)`, `dequeue()`, `flushQueue()` with exponential backoff retry on reconnect
    - _Requirements: 8.2, 8.3_

  - [ ]\* 5.3 Write property tests for offline mutation queuing
    - **Property 14: Offline Mutation Queuing** — any mutation enqueued while offline must appear in the queue and be flushed on reconnect
    - **Validates: Requirements 8.2**

- [x] 6. Core data hooks
  - [x] 6.1 Implement `useGardens` hook in `src/hooks/useGardens.ts`
    - Manage `gardens: Garden[]`, `isLoading`, `error` state with Zustand
    - Implement `createGarden`, `updateGarden`, `deleteGarden`, `refreshGardens` calling `apiClient`
    - On offline, serve from SQLite cache and enqueue mutations
    - _Requirements: 2.1, 2.7, 2.8, 2.9, 8.1, 8.2_

  - [x] 6.2 Write property tests for `useGardens` CRUD idempotency
    - **Property 8: CRUD Idempotency** — calling `updateGarden` with the same payload twice produces the same final state as calling it once
    - **Validates: Requirements 2.9**

  - [x] 6.3 Implement `usePlants` hook in `src/hooks/usePlants.ts`
    - Manage `plants: Plant[]`, `isLoading`, `error` state
    - Implement `createPlant`, `updatePlant`, `deletePlant` with API calls and local state sync
    - On delete, mark plant as pending-delete to block concurrent updates (Requirement 1.10)
    - _Requirements: 1.1, 1.7, 1.8, 1.9, 1.10_

  - [x] 6.4 Implement `useCalendar` hook in `src/hooks/useCalendar.ts`
    - Accept optional `plantId` filter; fetch events from API and filter client-side
    - Implement `createEvent`, `updateEvent`, `deleteEvent`
    - Hide orphaned events (where associated plant is deleted) from normal views
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]\* 6.5 Write property tests for calendar event referential integrity
    - **Property 3: Calendar Event Referential Integrity** — all events returned by `useCalendar(plantId)` must have `event.plantId === plantId`; orphaned events must not appear
    - **Validates: Requirements 4.2, 4.6**

  - [ ]\* 6.6 Write property tests for hook error isolation
    - **Property 13: Hook Error Isolation** — any async error in a hook sets `error` state and does not propagate an unhandled exception; other state values remain accessible
    - **Validates: Requirements 9.3**

- [ ] 7. Checkpoint — Ensure all hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Garden grid logic
  - [ ] 8.1 Implement `screenCoordsToCellCoords` utility in `src/utils/grid.ts`
    - Convert absolute screen coordinates to `{ row, col }` given grid origin and cell size
    - Return `null` for coordinates outside grid bounds
    - _Requirements: 3.5_

  - [ ] 8.2 Implement `useGardenGrid` hook in `src/hooks/useGardenGrid.ts`
    - Manage `cells: Record<string, CellState>`, `activeTool: DrawingTool`
    - Implement `handleCellChange(row, col, state)` applying the Touch Drawing Algorithm from the design
    - Implement `clearGrid()` and `exportGridSnapshot()` returning a base64 PNG via `react-native-skia`
    - Validate `plantId` references against the current plants collection before placement
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9_

  - [ ]\* 8.3 Write property tests for grid drawing tool invariants
    - **Property 11: Grid Drawing Tool Invariants** — `draw` sets `filled: true`; `erase` removes the key; `place_plant` sets `filled: true` with `plantId`; all other cells unchanged
    - **Property 12: Out-of-Bounds Touch Invariant** — touches outside grid bounds leave the cell map unchanged
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [ ]\* 8.4 Write property tests for grid cell count invariant
    - **Property 7: Grid Cell Count Invariant** — for any valid `(widthInches, heightInches)`, the rendered grid contains exactly `(widthInches × 4) × (heightInches × 4)` cells, each rendered exactly once
    - **Validates: Requirements 3.1, 3.7**

  - [ ]\* 8.5 Write property tests for grid plant reference integrity
    - **Property 5: Grid Plant Reference Integrity** — any `place_plant` attempt with an invalid or non-existent `plantId` is rejected; all accepted placements reference a valid `Plant.id`
    - **Validates: Requirements 3.6**

- [x] 9. Weather hook
  - [x] 9.1 Implement `useWeather` hook in `src/hooks/useWeather.ts`
    - Accept `WeatherOptions` (`zipCode` or `useDeviceLocation`)
    - Request device location via `expo-location` when `useDeviceLocation` is true
    - Call `apiClient.get('/weather?...')` and cache result in MMKV with timestamp
    - Serve cached data if < 10 minutes old; trigger background refresh if ≥ 10 minutes old
    - On stale-cache refresh failure, set `error` state (do not serve stale data)
    - On location permission denied, emit event for zip code fallback prompt
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]\* 9.2 Write property tests for weather cache freshness
    - **Property 6: Weather Cache Freshness** — while cached entry is < 10 min old, no new API call is made; when ≥ 10 min old, a background refresh is triggered
    - **Validates: Requirements 6.4, 6.5, 6.6**

- [ ] 10. Photo hook
  - [ ] 10.1 Implement `usePhotos` hook in `src/hooks/usePhotos.ts`
    - Accept `{ gardenId?, plantId? }` context
    - Implement `capturePhoto()`: request camera permission, open camera via `expo-camera`, store locally with `expo-file-system`
    - Implement `pickFromGallery()`: request media library permission, open picker via `expo-image-picker`, store locally
    - Implement upload flow: request presigned URL → PUT to S3 → persist metadata to DynamoDB
    - On presigned URL failure or non-200 S3 response, retain local photo with `s3Key` unset and set `error` state
    - Implement `deletePhoto(photoId)`: remove from list, delete S3 object, delete DynamoDB record
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]\* 10.2 Write property tests for photo upload atomicity
    - **Property 4: Photo Upload Atomicity** — if presigned URL request fails or S3 PUT returns non-200, no DynamoDB record is created; photo remains local-only with `s3Key` unset
    - **Validates: Requirements 5.6, 5.7, 9.5**

- [ ] 11. Checkpoint — Ensure all hook and utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Shared UI components
  - [ ] 12.1 Implement `FormModal` component in `src/components/FormModal.tsx`
    - Animate in/out as a bottom sheet using `react-native-reanimated`
    - Render consistent header with title and close button; handle keyboard avoidance
    - _Requirements: 2.1, 4.1_

  - [ ] 12.2 Implement `GardenGrid` component in `src/components/GardenGrid.tsx`
    - Render scrollable canvas using `react-native-skia` at 1/4" cell resolution
    - Handle pan gesture via `react-native-gesture-handler` for multi-cell drawing
    - Highlight cells with `plantId`; emit `onCellChange` for each modified cell
    - Accept `readOnly` prop for preview mode
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ] 12.3 Implement `DrawingToolbar` component in `src/components/DrawingToolbar.tsx`
    - Render tool buttons for `draw`, `erase`, `place_plant`, `select`
    - Highlight active tool; call `onToolChange` on press
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 12.4 Implement `PlantCard` component in `src/components/PlantCard.tsx`
    - Display plant name, species, variety
    - Show thumbnail of most recent photo when available (no thumbnail when no photos)
    - Provide edit and delete action buttons
    - _Requirements: 1.9, 5.9_

  - [ ]\* 12.5 Write property tests for `PlantCard` photo display
    - **Property 15: PlantCard Photo Display** — plants with ≥1 photo render a thumbnail from the most recent photo; plants with no photos render no thumbnail
    - **Validates: Requirements 5.9**

  - [ ] 12.6 Implement `GardenCard` component in `src/components/GardenCard.tsx`
    - Display garden name, type, size; navigate to detail on press; provide edit and delete actions
    - _Requirements: 2.1_

  - [ ] 12.7 Implement `PhotoPicker` component in `src/components/PhotoPicker.tsx`
    - Present action sheet with "Take Photo" and "Choose from Gallery" options
    - Delegate to `usePhotos` for permission requests and image selection
    - Return local URI via `onImageSelected` callback
    - _Requirements: 5.1, 5.2_

  - [ ] 12.8 Implement `WeatherWidget` component in `src/components/WeatherWidget.tsx`
    - Invoke `useWeather` hook; render temperature, condition description, and weather icon
    - Show loading skeleton and error state; support `compact` prop
    - _Requirements: 6.3, 6.8_

  - [ ]\* 12.9 Write property tests for `WeatherWidget` required fields
    - **Property 16: Weather Widget Required Fields** — for any successful `WeatherResponse`, the widget renders temperature, condition description, and weather icon; no required field is silently omitted
    - **Validates: Requirements 6.3**

  - [ ] 12.10 Implement `CalendarView` component in `src/components/CalendarView.tsx`
    - Render monthly grid with event dots using `react-native-calendars`
    - Support swipe navigation between months; highlight today; call `onDayPress` and `onEventPress`
    - _Requirements: 4.1, 4.2_

  - [ ] 12.11 Implement `OfflineBanner` component in `src/components/OfflineBanner.tsx`
    - Display a persistent banner when the device has no network connectivity
    - Use `@react-native-community/netinfo` or equivalent to detect connectivity
    - _Requirements: 8.4_

- [ ] 13. Checkpoint — Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Screens and navigation
  - [ ] 14.1 Implement authentication screens in `app/(auth)/`
    - Create `sign-in.tsx` with Cognito sign-in form using `aws-amplify`
    - Create `_layout.tsx` to redirect authenticated users away from auth screens
    - _Requirements: 7.1, 7.3_

  - [ ] 14.2 Implement root layout and tab navigation in `app/_layout.tsx` and `app/(tabs)/_layout.tsx`
    - Protect all tab routes behind Cognito auth check; redirect unauthenticated users to sign-in
    - Add `OfflineBanner` to root layout so it appears on all screens
    - _Requirements: 7.1, 8.4_

  - [ ] 14.3 Implement Plants screen in `app/(tabs)/plants.tsx`
    - Use `usePlants` hook and `@shopify/flash-list` to render `PlantCard` list
    - Add FAB to open `FormModal` for plant creation; support edit and delete via `PlantCard` actions
    - Inline validation errors from `validatePlant` displayed in the form
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ] 14.4 Implement Gardens screen in `app/(tabs)/gardens.tsx`
    - Use `useGardens` hook and `@shopify/flash-list` to render `GardenCard` list
    - Add FAB to open `FormModal` for garden creation with dimension inputs
    - Inline validation errors from `validateGarden` displayed in the form
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 14.5 Implement Garden Detail screen in `app/gardens/[id].tsx`
    - Render `GardenGrid` with `useGardenGrid` hook loaded from persisted cell state
    - Render `DrawingToolbar`; save grid state on change via `useGardens.updateGarden`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9_

  - [ ] 14.6 Implement Plant Detail screen in `app/plants/[id].tsx`
    - Render `PlantCard`, `CalendarView` (via `useCalendar(plantId)`), and photo gallery (via `usePhotos`)
    - Provide "Add Event" action opening `FormModal` for event creation
    - Provide `PhotoPicker` for adding photos
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.8, 5.9_

  - [ ] 14.7 Implement Dashboard screen in `app/(tabs)/index.tsx`
    - Render `WeatherWidget` (device location or zip code)
    - Show summary counts for gardens and plants
    - Prompt for zip code if location permission denied; save preference to MMKV
    - _Requirements: 6.1, 6.2, 6.9_

  - [ ] 14.8 Implement Settings / Profile screen in `app/(tabs)/settings.tsx`
    - Provide sign-out button that calls `signOut()` from `src/lib/auth.ts`
    - _Requirements: 7.5_

- [ ] 15. Error handling and resilience wiring
  - [ ] 15.1 Implement global error toast in `src/components/ErrorToast.tsx`
    - Display error toast with retry action when a hook's `error` state is set for 5xx Lambda errors
    - _Requirements: 9.1_

  - [ ] 15.2 Implement exponential backoff retry in `src/lib/apiClient.ts`
    - Wrap API calls with retry logic: retry on 5xx and DynamoDB throttle (429) responses using exponential backoff
    - On network timeout, fall back to cached local data and set a status indicator
    - _Requirements: 9.2, 8.5, 8.6_

- [ ] 16. Integration wiring and MSW integration tests
  - [ ] 16.1 Set up MSW handlers in `src/__tests__/mocks/handlers.ts`
    - Mock all API Gateway routes: `/gardens`, `/plants`, `/calendar`, `/photos`, `/photos/presign`, `/weather`
    - _Requirements: 2.1, 1.1, 4.1, 5.4, 6.1_

  - [ ]\* 16.2 Write integration tests for Plant CRUD flow
    - Test create → read → update → delete for `Plant` using MSW mocks
    - _Requirements: 1.1, 1.7, 1.8_

  - [ ]\* 16.3 Write integration tests for Garden CRUD flow
    - Test create → read → update → delete for `Garden` using MSW mocks
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ]\* 16.4 Write integration tests for photo upload flow
    - Test full upload flow: presigned URL request → S3 PUT → DynamoDB metadata persist, and failure paths
    - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [ ] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Property tests use `fast-check` as specified in the design document
- Unit and integration tests use `jest` + `@testing-library/react-native`
- Integration tests use MSW (Mock Service Worker) to mock AWS Lambda responses
- AWS credentials and API keys must be configured as EAS environment secrets — never hardcoded

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.3", "2.5"] },
    { "id": 1, "tasks": ["2.2", "2.4", "2.6", "4.1"] },
    { "id": 2, "tasks": ["4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["4.3", "5.3", "6.1", "6.3", "6.4", "8.1", "9.1"] },
    { "id": 4, "tasks": ["6.2", "6.5", "6.6", "8.2", "10.1"] },
    { "id": 5, "tasks": ["8.3", "8.4", "8.5", "9.2", "10.2"] },
    {
      "id": 6,
      "tasks": [
        "12.1",
        "12.2",
        "12.3",
        "12.4",
        "12.6",
        "12.7",
        "12.8",
        "12.10",
        "12.11"
      ]
    },
    { "id": 7, "tasks": ["12.5", "12.9", "15.1", "15.2"] },
    { "id": 8, "tasks": ["14.1", "14.2", "16.1"] },
    { "id": 9, "tasks": ["14.3", "14.4", "14.5", "14.6", "14.7", "14.8"] },
    { "id": 10, "tasks": ["16.2", "16.3", "16.4"] }
  ]
}
```
