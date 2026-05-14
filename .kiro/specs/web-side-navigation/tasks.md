# Implementation Plan: Web Side Navigation

## Overview

Replace the existing `(tabs)` route group with a `(drawer)` route group using expo-router's Drawer layout backed by `@react-navigation/drawer`. The drawer is permanently visible on viewports wider than 768px and collapsible on smaller viewports. The root Stack navigator remains for detail screens.

## Tasks

- [x] 1. Install dependency and create drawer layout
  - [x] 1.1 Add `@react-navigation/drawer` dependency to package.json
    - Add `@react-navigation/drawer` to the dependencies section
    - _Requirements: 6.3_

  - [x] 1.2 Create `app/(drawer)/_layout.tsx` with responsive drawer configuration
    - Implement `DrawerLayout` component using `Drawer` from `expo-router/drawer`
    - Use `useWindowDimensions` to determine `drawerType` based on 768px breakpoint
    - Configure four `Drawer.Screen` entries: index (Dashboard), plants, gardens, settings
    - Assign FontAwesome icons: home, leaf, code, cog
    - Set `drawerStyle.width` to 240
    - Set `headerShown: false` on large screens, show header with toggle on small screens
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.4, 6.1, 6.2_

- [x] 2. Migrate screen files from tabs to drawer
  - [x] 2.1 Move `app/(tabs)/index.tsx` to `app/(drawer)/index.tsx`
    - Copy the file contents preserving all existing screen logic
    - _Requirements: 1.2, 4.3_

  - [x] 2.2 Move `app/(tabs)/plants.tsx` to `app/(drawer)/plants.tsx`
    - Copy the file contents preserving all existing screen logic
    - _Requirements: 1.2_

  - [x] 2.3 Move `app/(tabs)/gardens.tsx` to `app/(drawer)/gardens.tsx`
    - Copy the file contents preserving all existing screen logic
    - _Requirements: 1.2_

  - [x] 2.4 Move `app/(tabs)/settings.tsx` to `app/(drawer)/settings.tsx`
    - Copy the file contents preserving all existing screen logic
    - _Requirements: 1.2_

  - [x] 2.5 Delete `app/(tabs)/_layout.tsx` and the `(tabs)` directory
    - Remove the old tab layout file and directory entirely
    - _Requirements: 4.1_

- [x] 3. Update root layout to reference drawer group
  - [x] 3.1 Modify `app/_layout.tsx` to use `(drawer)` as initial route
    - Change `unstable_settings.initialRouteName` from `(tabs)` to `(drawer)`
    - Replace `<Stack.Screen name="(tabs)" ...>` with `<Stack.Screen name="(drawer)" options={{ headerShown: false }} />`
    - Preserve existing Stack screens for `plants/[id]` and `gardens/[id]` detail routes
    - _Requirements: 4.2, 4.3, 5.1, 5.2_

- [~] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write tests for drawer navigation
  - [x] 5.1 Write unit tests for DrawerLayout component
    - Verify all four drawer items render with correct labels (Dashboard, Plants, Gardens, Settings)
    - Verify correct FontAwesome icons are assigned (home, leaf, code, cog)
    - Verify no bottom tab bar is rendered
    - _Requirements: 1.1, 1.3, 1.4, 4.1_

  - [ ]* 5.2 Write property test for large screen permanent drawer mode
    - **Property 1: Large screen permanent drawer mode**
    - Generate random widths > 768 and verify `drawerType` resolves to `'permanent'`
    - Minimum 100 iterations with fast-check
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 5.3 Write property test for small screen collapsible drawer mode
    - **Property 2: Small screen collapsible drawer mode**
    - Generate random widths <= 768 and verify `drawerType` resolves to `'front'` and header toggle is present
    - Minimum 100 iterations with fast-check
    - **Validates: Requirements 3.1, 3.4**

  - [ ]* 5.4 Write property test for auto-close on small screen navigation
    - **Property 3: Auto-close on small screen navigation**
    - For any drawer item selection at widths <= 768, verify drawer closes after navigation
    - Minimum 100 iterations with fast-check
    - **Validates: Requirements 3.3**

  - [ ]* 5.5 Write property test for active item highlighting
    - **Property 4: Active item highlighting**
    - For any currently displayed screen, verify the corresponding drawer item is highlighted
    - Minimum 100 iterations with fast-check
    - **Validates: Requirements 5.3**

- [~] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript with Jest + @testing-library/react-native and fast-check for property tests
- Follow workspace conventions: named exports, `const fn = () => {}; export { fn };` pattern

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["2.5", "3.1"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] }
  ]
}
```
