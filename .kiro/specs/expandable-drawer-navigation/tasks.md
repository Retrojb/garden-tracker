# Implementation Plan: Expandable Drawer Navigation

## Overview

Convert the existing default drawer content into a custom component tree with expandable/collapsible sections for Plants and Gardens. Each section dynamically renders sub-items from Zustand-backed hooks with animated height transitions via React Native Reanimated. Implementation proceeds bottom-up: shared types → leaf components → composite components → layout integration.

## Tasks

- [x] 1. Define shared types and set up component scaffolding
  - [x] 1.1 Create navigation component types
    - Create `src/components/navigation/types.ts` with all shared interfaces and types (`ExpandableSectionKey`, `ExpandedSectionsState`, `IDrawerParentItemProps`, `IExpandableDrawerSectionProps`, `IChevronToggleProps`, `IAnimatedSubItemListProps`, `IDrawerSubItemProps`)
    - Use the `type` and `interface` exports pattern per project conventions
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement leaf-level components
  - [x] 2.1 Implement DrawerSubItem component
    - Create `src/components/navigation/DrawerSubItem.tsx`
    - Render a `Pressable` with indented label text and active/inactive styling via className
    - Accept `IDrawerSubItemProps` and call `onPress` on tap
    - _Requirements: 4.3, 5.1, 5.2, 7.1_

  - [x] 2.2 Implement ChevronToggle component
    - Create `src/components/navigation/ChevronToggle.tsx`
    - Render a `Pressable` with 44x44dp minimum tap target (`w-11 h-11`)
    - Use Reanimated `useSharedValue` and `useAnimatedStyle` to rotate chevron-right icon between 0° (collapsed) and 90° (expanded) with 300ms `withTiming`
    - Include `accessibilityRole="button"` and dynamic `accessibilityLabel`
    - _Requirements: 2.2, 2.4, 3.4, 7.3_

  - [x] 2.3 Implement AnimatedSubItemList component
    - Create `src/components/navigation/AnimatedSubItemList.tsx`
    - Use `onLayout` to measure children height into a Reanimated shared value
    - Animate outer `Animated.View` height between 0 and measured height with 300ms `withTiming`
    - Apply `overflow: 'hidden'` to prevent clipping during transition
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 2.4 Implement DrawerParentItem component
    - Create `src/components/navigation/DrawerParentItem.tsx`
    - Render a `Pressable` with icon (FontAwesome) and label text
    - Apply active/inactive styling via className based on `isActive` prop
    - _Requirements: 1.4, 7.2_

  - [x] 2.5 Write unit tests for leaf components
    - Test DrawerSubItem renders label and calls onPress
    - Test ChevronToggle has 44x44dp tap target and correct accessibility attributes
    - Test DrawerParentItem renders icon and label with active styling
    - _Requirements: 2.4, 4.3, 7.1, 7.2_

- [x] 3. Implement composite ExpandableDrawerSection
  - [x] 3.1 Implement ExpandableDrawerSection component
    - Create `src/components/navigation/ExpandableDrawerSection.tsx`
    - Compose split tap targets: label area (`Pressable` with icon + text) calls `onLabelPress`, chevron area renders `ChevronToggle` calling `onToggle`
    - Render `AnimatedSubItemList` with `children` slot for sub-items
    - Apply active styling to label area based on `isActive` prop
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 7.2_

  - [ ]* 3.2 Write property test: Toggle is its own inverse
    - **Property 1: Toggle is its own inverse**
    - Verify toggling a section twice returns to original state
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Write property test: Chevron tap never triggers navigation
    - **Property 2: Chevron tap never triggers navigation**
    - Verify tapping chevron only changes expand/collapse state, never invokes navigation
    - **Validates: Requirements 2.2, 2.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement CustomDrawerContent and integrate with layout
  - [x] 5.1 Implement CustomDrawerContent component
    - Create `src/components/navigation/CustomDrawerContent.tsx`
    - Accept `DrawerContentComponentProps` from `@react-navigation/drawer`
    - Manage `expandedSections` state via `useState<ExpandedSectionsState>`
    - Render items in order: Dashboard (DrawerParentItem), Plants (ExpandableDrawerSection), Gardens (ExpandableDrawerSection), Settings (DrawerParentItem)
    - Call `usePlants()` and `useGardens()` hooks to populate sub-items
    - Derive active state from navigation state and `usePathname()` from expo-router
    - Handle loading states with `ActivityIndicator` and empty states with text messages
    - Handle plant name fallback: use `name`, fall back to `species`, then "Unnamed Plant"
    - Use `router.push()` for detail routes and `navigation.navigate()` for drawer screens
    - Call `navigation.closeDrawer()` after sub-item navigation when drawer is non-permanent (width ≤ 768dp)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 8.3_

  - [x] 5.2 Integrate CustomDrawerContent into drawer layout
    - Modify `app/(drawer)/_layout.tsx` to pass `drawerContent={(props) => <CustomDrawerContent {...props} />}` to the `<Drawer>` component
    - Keep all existing `Drawer.Screen` definitions and `screenOptions` unchanged
    - _Requirements: 1.1, 1.2, 8.1, 8.2_

  - [x] 5.3 Write property test: Sub-item count equals data length
    - **Property 3: Sub-item count equals data length**
    - For any non-empty array from `usePlants()` or `useGardens()`, verify rendered sub-item count matches array length
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 5.4 Write property test: Sub-item label matches record name
    - **Property 4: Sub-item label matches record name**
    - For any record with a defined `name` field, verify the sub-item label text matches exactly
    - **Validates: Requirements 4.3**

  - [ ]* 5.5 Write property test: Sub-item navigation produces correct route
    - **Property 5: Sub-item navigation produces correct route**
    - For any plant with id X, verify navigation to `/plants/X`; for any garden with id Y, verify navigation to `/gardens/Y`
    - **Validates: Requirements 5.1, 5.2**

- [x] 6. Implement active state highlighting and responsive behavior
  - [x] 6.1 Add active state detection for sub-items
    - In `CustomDrawerContent`, use `usePathname()` to determine if current route matches a sub-item's detail route
    - Pass `isActive` prop to the matching `DrawerSubItem` and ensure only one sub-item is highlighted at a time
    - _Requirements: 7.1_

  - [ ]* 6.2 Write property test: Active route highlights corresponding sub-item
    - **Property 6: Active route highlights corresponding sub-item**
    - For any pathname matching `/plants/[id]` or `/gardens/[id]`, verify exactly one sub-item receives active styling
    - **Validates: Requirements 7.1**

  - [ ]* 6.3 Write property test: Expand/collapse state preserved across layout transitions
    - **Property 7: Expand/collapse state preserved across layout transitions**
    - Verify expand/collapse state remains unchanged when screen width crosses the 768dp breakpoint
    - **Validates: Requirements 8.3**

- [~] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (React Native with Expo)
- All components follow the project's named export and `className`-based styling conventions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] }
  ]
}
```
