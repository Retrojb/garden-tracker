# Requirements Document

## Introduction

The garden detail page (`app/gardens/[id].tsx`) displays the full details of a selected garden. The layout includes a heading card showing the garden name, followed by a wrapping row of compact plant cards representing the plants associated with that garden. A `usePlants` hook provides plant data filtered by garden ID, following the existing Zustand + MMKV caching pattern. When no plants exist for a garden, an empty state with an add action is displayed.

## Glossary

- **Garden_Detail_Page**: The screen rendered at `app/gardens/[id].tsx` that displays a single garden's information and its associated plants.
- **Heading_Card**: A Card component instance displaying the garden name as the primary heading element on the Garden_Detail_Page.
- **Plant_Card**: A Card component rendered in the compact variant, displaying a single plant's name within the wrapping row.
- **Plant_Row**: A flex-wrap container that arranges Plant_Cards in a responsive horizontal row, wrapping to additional lines as needed.
- **usePlants_Hook**: A React hook that fetches and caches plant data filtered by garden ID, following the Zustand + MMKV pattern established by `useGardens`.
- **Empty_State**: A UI region displayed when a garden has zero associated plants, containing a message and an add action.
- **IPlant**: The TypeScript interface representing a plant entity, including id, name, species, variety, gardenId, and timestamps.

## Requirements

### Requirement 1: Garden Heading Card

**User Story:** As a user, I want to see the garden name prominently displayed at the top of the detail page, so that I can confirm which garden I am viewing.

#### Acceptance Criteria

1. WHEN the Garden_Detail_Page loads with a valid garden ID, THE Heading_Card SHALL display the garden name as the card title.
2. THE Heading_Card SHALL render using the Card component with the basic variant.
3. WHEN the garden data is loading, THE Garden_Detail_Page SHALL display a loading indicator in place of the Heading_Card.

### Requirement 2: Plant Row Layout

**User Story:** As a user, I want to see all plants in my garden displayed as compact cards in a wrapping row, so that I can quickly scan which plants are in the garden.

#### Acceptance Criteria

1. WHEN the Garden_Detail_Page loads and plants exist for the garden, THE Plant_Row SHALL render one Plant_Card for each plant associated with the garden.
2. THE Plant_Row SHALL use a flex-wrap layout that arranges Plant_Cards horizontally and wraps to additional lines when the available width is exceeded.
3. THE Plant_Card SHALL render using the Card component with the compact variant.
4. THE Plant_Card SHALL display the plant name as the card title.
5. THE Plant_Row SHALL render responsively across mobile, tablet, and web viewports.

### Requirement 3: usePlants Hook

**User Story:** As a developer, I want a `usePlants` hook that fetches plants filtered by garden ID, so that the Garden_Detail_Page can display only the relevant plants.

#### Acceptance Criteria

1. THE usePlants_Hook SHALL accept a garden ID parameter and return only plants associated with that garden.
2. THE usePlants_Hook SHALL manage state using a Zustand store consistent with the useGardens pattern.
3. THE usePlants_Hook SHALL cache fetched plant data in MMKV storage for offline access.
4. WHILE the usePlants_Hook is fetching data, THE usePlants_Hook SHALL expose an `isLoading` state set to true.
5. IF the API request fails, THEN THE usePlants_Hook SHALL expose an `error` state containing the error details.
6. WHEN the device is offline, THE usePlants_Hook SHALL serve plant data from the MMKV cache.

### Requirement 4: Plant-Garden Association

**User Story:** As a developer, I want the IPlant interface to include a gardenId field, so that plants can be associated with a specific garden.

#### Acceptance Criteria

1. THE IPlant interface SHALL include a `gardenId` field of type string that references the associated garden's ID.
2. THE usePlants_Hook SHALL use the gardenId field to filter plants by the requested garden.

### Requirement 5: Empty State

**User Story:** As a user, I want to see a helpful message and an add action when my garden has no plants, so that I know the garden is empty and can take action to add plants.

#### Acceptance Criteria

1. WHEN the Garden_Detail_Page loads and zero plants are associated with the garden, THE Empty_State SHALL display a message indicating no plants exist (e.g., "No plants yet").
2. WHEN the Garden_Detail_Page loads and zero plants are associated with the garden, THE Empty_State SHALL display an actionable element (button or link) that initiates adding a plant.
3. WHILE the usePlants_Hook is loading, THE Garden_Detail_Page SHALL NOT display the Empty_State.
