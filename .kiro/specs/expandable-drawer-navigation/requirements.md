# Requirements Document

## Introduction

The Expandable Drawer Navigation feature enhances the existing drawer sidebar by adding expandable/collapsible sections beneath the "Plants" and "Gardens" parent items. Each section dynamically displays sub-items (individual plants or gardens) fetched from the existing `usePlants()` and `useGardens()` hooks. Parent item labels navigate to their respective list screens, while a separate chevron icon toggles the expand/collapse of nested sub-items with smooth animated height transitions powered by React Native Reanimated.

## Glossary

- **Drawer**: The side navigation panel rendered by `@react-navigation/drawer` in the app layout
- **Custom_Drawer_Content**: A custom React component that replaces the default drawer content to support expandable sections
- **Parent_Item**: A top-level drawer navigation entry (Dashboard, Plants, Gardens, Settings)
- **Expandable_Parent_Item**: A Parent_Item that contains nested Sub_Items and supports expand/collapse behavior (Plants, Gardens)
- **Sub_Item**: A nested navigation entry within an Expandable_Parent_Item representing an individual plant or garden record
- **Chevron_Icon**: A directional arrow icon rendered alongside an Expandable_Parent_Item label that toggles the expand/collapse state
- **Expand_Collapse_Animation**: A smooth height transition animation driven by React Native Reanimated that reveals or hides Sub_Items
- **Detail_Route**: A screen outside the drawer group that displays a single plant or garden record (e.g., `/plants/[id]`, `/gardens/[id]`)

## Requirements

### Requirement 1: Custom Drawer Content Integration

**User Story:** As a developer, I want the drawer to use a custom content component, so that expandable sections can be rendered alongside standard drawer items.

#### Acceptance Criteria

1. THE Custom_Drawer_Content SHALL render all existing Parent_Items (Dashboard, Plants, Gardens, Settings) in the same order as the current drawer layout.
2. THE Custom_Drawer_Content SHALL pass through all default drawer props (active state, navigation state) to each Parent_Item.
3. WHEN the drawer is rendered, THE Custom_Drawer_Content SHALL display Expandable_Parent_Items for Plants and Gardens with a Chevron_Icon adjacent to each label.
4. THE Custom_Drawer_Content SHALL render Dashboard and Settings as standard non-expandable Parent_Items that navigate on tap.

### Requirement 2: Split Tap Interaction on Expandable Parent Items

**User Story:** As a user, I want to tap the label to navigate and tap the chevron to expand, so that I can access both the list screen and the nested sub-items independently.

#### Acceptance Criteria

1. WHEN the user taps the label area of an Expandable_Parent_Item, THE Custom_Drawer_Content SHALL navigate to the corresponding list screen (plants.tsx for Plants, gardens.tsx for Gardens).
2. WHEN the user taps the Chevron_Icon of an Expandable_Parent_Item, THE Custom_Drawer_Content SHALL toggle the expand/collapse state of the associated Sub_Items section.
3. WHEN the user taps the Chevron_Icon, THE Custom_Drawer_Content SHALL keep the user on the current screen without triggering navigation.
4. THE Chevron_Icon SHALL have a minimum tap target size of 44x44 density-independent pixels for accessibility compliance.

### Requirement 3: Animated Expand and Collapse

**User Story:** As a user, I want smooth animations when sections expand or collapse, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN the expand/collapse state changes, THE Expand_Collapse_Animation SHALL animate the height of the Sub_Items container from 0 to its measured content height (or vice versa).
2. THE Expand_Collapse_Animation SHALL use React Native Reanimated shared values and animated styles to drive the height transition.
3. THE Expand_Collapse_Animation SHALL complete within 300 milliseconds.
4. WHEN the expand/collapse state changes, THE Chevron_Icon SHALL animate its rotation to indicate the current state (pointing down when expanded, pointing right when collapsed).
5. THE Expand_Collapse_Animation SHALL not cause layout jumps or clipping of adjacent drawer items during the transition.

### Requirement 4: Dynamic Sub-Item Population

**User Story:** As a user, I want to see my actual plants and gardens listed as sub-items in the drawer, so that I can quickly navigate to a specific record.

#### Acceptance Criteria

1. WHILE the Plants section is expanded, THE Custom_Drawer_Content SHALL display one Sub_Item for each plant returned by the `usePlants()` hook.
2. WHILE the Gardens section is expanded, THE Custom_Drawer_Content SHALL display one Sub_Item for each garden returned by the `useGardens()` hook.
3. THE Custom_Drawer_Content SHALL display the `name` field of each IPlant or IGarden record as the Sub_Item label.
4. WHEN the data from `usePlants()` or `useGardens()` changes, THE Custom_Drawer_Content SHALL re-render the Sub_Items to reflect the updated data.

### Requirement 5: Sub-Item Navigation

**User Story:** As a user, I want to tap a sub-item to navigate directly to its detail screen, so that I can access individual records without going through the list first.

#### Acceptance Criteria

1. WHEN the user taps a plant Sub_Item, THE Custom_Drawer_Content SHALL navigate to the Detail_Route `/plants/[id]` using the `id` field of the corresponding IPlant record.
2. WHEN the user taps a garden Sub_Item, THE Custom_Drawer_Content SHALL navigate to the Detail_Route `/gardens/[id]` using the `id` field of the corresponding IGarden record.
3. WHEN navigation to a Detail_Route occurs on a non-permanent drawer (screen width 768dp or below), THE Drawer SHALL close after navigation.

### Requirement 6: Loading and Empty States

**User Story:** As a user, I want clear feedback when data is loading or when I have no items, so that I understand the current state of the drawer sections.

#### Acceptance Criteria

1. WHILE `usePlants()` or `useGardens()` returns `isLoading` as true, THE Custom_Drawer_Content SHALL display a loading indicator within the expanded section.
2. WHEN `usePlants()` returns an empty array and the Plants section is expanded, THE Custom_Drawer_Content SHALL display a message indicating no plants exist.
3. WHEN `useGardens()` returns an empty array and the Gardens section is expanded, THE Custom_Drawer_Content SHALL display a message indicating no gardens exist.

### Requirement 7: Visual State Indicators

**User Story:** As a user, I want visual cues that indicate which item is active and which sections are expanded, so that I can orient myself within the navigation.

#### Acceptance Criteria

1. WHILE a Detail_Route is active, THE Custom_Drawer_Content SHALL visually highlight the corresponding Sub_Item.
2. WHILE a list screen is active, THE Custom_Drawer_Content SHALL visually highlight the corresponding Expandable_Parent_Item label.
3. THE Chevron_Icon SHALL visually indicate the current expand/collapse state through its rotation angle (right-pointing when collapsed, down-pointing when expanded).

### Requirement 8: Responsive Behavior

**User Story:** As a user, I want the expandable drawer to work correctly on both mobile and tablet/desktop layouts, so that the experience is consistent across devices.

#### Acceptance Criteria

1. WHILE the screen width exceeds 768 density-independent pixels, THE Drawer SHALL render as a permanent sidebar with expandable sections visible at all times.
2. WHILE the screen width is 768 density-independent pixels or below, THE Drawer SHALL render as an overlay that slides in from the left with expandable sections functioning identically.
3. THE Custom_Drawer_Content SHALL preserve the expand/collapse state of each section when the drawer type transitions between permanent and overlay modes.
