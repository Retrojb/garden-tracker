# Requirements Document

## Introduction

The Garden Tracker App is a React Native (Expo) mobile application that enables users to plan, visualize, and track their gardens. Users can design garden layouts on a drawable 1/4" grid, manage plant records, capture or import photos, track harvest calendars, and check local weather — all backed by AWS infrastructure for cloud persistence. The app supports offline-first operation with automatic sync when connectivity is restored.

## Glossary

- **App**: The Garden Tracker React Native (Expo) mobile application
- **Garden**: A user-defined garden record with a name, type, dimensions, and an associated grid layout
- **Plant**: A user-defined plant record with a name, species, and optional variety
- **CalendarEvent**: A timestamped event associated with a plant (e.g., planted, watered, harvested)
- **Photo**: An image captured or imported by the user, associated with a garden or plant
- **GardenGrid**: The interactive 1/4" resolution canvas used to draw and visualize a garden layout
- **Cell**: A single 1/4" × 1/4" unit within a GardenGrid
- **DrawingTool**: The active tool used to interact with the GardenGrid (`draw`, `erase`, `place_plant`, `select`)
- **WeatherWidget**: The UI component that displays current weather conditions
- **Validator**: The client-side validation logic for plant and garden input fields
- **API**: The AWS API Gateway + Lambda backend that handles all remote data operations
- **DynamoDB**: The AWS DynamoDB database used for persistent storage of gardens, plants, events, and photo metadata
- **S3**: The AWS S3 bucket used for storing garden and plant photos
- **Cognito**: The AWS Cognito service used for user authentication and authorization
- **LocalStorage**: The on-device storage layer (expo-sqlite / MMKV) used for caching and offline support
- **EAS**: Expo Application Services, used for building and deploying the app

---

## Requirements

### Requirement 1: Plant Management

**User Story:** As a gardener, I want to create, view, update, and delete plant records, so that I can maintain an organized catalog of everything I grow.

#### Acceptance Criteria

1. WHEN a user submits a new plant form with a valid name and species, THE App SHALL create a new Plant record and append it to the plant list
2. WHEN a user submits a plant form with an empty or whitespace-only name, THE Validator SHALL reject the submission and display an inline error message
3. WHEN a user submits a plant form with a name exceeding 100 characters, THE Validator SHALL reject the submission and display an inline error message
4. WHEN a user submits a plant form with an empty or whitespace-only species, THE Validator SHALL reject the submission and display an inline error message
5. WHEN a user submits a plant form with a species exceeding 100 characters, THE Validator SHALL reject the submission and display an inline error message
6. WHEN a user submits a plant form with a variety exceeding 100 characters, THE Validator SHALL reject the submission and display an inline error message
7. WHEN a plant is successfully created or updated, THE App SHALL persist the Plant record to DynamoDB
8. WHEN a user deletes a plant, THE App SHALL remove the Plant from the plant list and delete it from DynamoDB
9. THE App SHALL display each plant's name, species, and variety in the plant list
10. WHEN a plant is marked for deletion, THE App SHALL prevent any concurrent update operations on that plant

---

### Requirement 2: Garden Management

**User Story:** As a gardener, I want to create, view, update, and delete garden records with precise dimensions, so that I can organize and track multiple garden spaces.

#### Acceptance Criteria

1. WHEN a user submits a new garden form with a valid name, type, and dimensions, THE App SHALL create a new Garden record and append it to the garden list
2. WHEN a user submits a garden form with an empty or whitespace-only name, THE Validator SHALL reject the submission and display an inline error message
3. WHEN a user submits a garden form with a name exceeding 100 characters, THE Validator SHALL reject the submission and display an inline error message
4. WHEN a user submits a garden form with a `widthInches` value that is zero, negative, or greater than 1200, THE Validator SHALL reject the submission and display an inline error message
5. WHEN a user submits a garden form with a `heightInches` value that is zero, negative, or greater than 1200, THE Validator SHALL reject the submission and display an inline error message
6. WHEN a user submits a garden form with an invalid or missing garden type, THE Validator SHALL reject the submission and display an inline error message
7. WHEN a garden is successfully created or updated, THE App SHALL persist the Garden record to DynamoDB
8. WHEN a user deletes a garden, THE App SHALL remove the Garden from the garden list and delete it from DynamoDB
9. WHEN a user updates a garden with the same payload more than once, THE App SHALL produce the same final garden state as applying the update once

---

### Requirement 3: Garden Grid Layout

**User Story:** As a gardener, I want to draw and edit my garden layout on a 1/4" grid, so that I can visually plan where each plant goes.

#### Acceptance Criteria

1. WHEN a garden grid is rendered with dimensions `(widthInches, heightInches)`, THE GardenGrid SHALL display exactly `(widthInches × 4) × (heightInches × 4)` cells
2. WHEN a user draws on the grid with the `draw` tool, THE GardenGrid SHALL mark the touched cell as filled
3. WHEN a user draws on the grid with the `erase` tool, THE GardenGrid SHALL remove the fill from the touched cell
4. WHEN a user draws on the grid with the `place_plant` tool and a plant is selected, THE GardenGrid SHALL mark the touched cell as filled and associate it with the selected plant's ID
5. WHEN a user touches outside the grid bounds, THE GardenGrid SHALL leave the cell map unchanged
6. THE GardenGrid SHALL only accept a `plantId` that references a valid Plant record for all plant placements, regardless of how the placement occurs
7. THE GardenGrid SHALL render each cell exactly once per render pass
8. WHEN a user clears the grid, THE GardenGrid SHALL reset all cells to an empty state
9. WHEN `exportGridSnapshot` is called, THE GardenGrid SHALL return a valid base64-encoded PNG string representing the current grid state

---

### Requirement 4: Calendar and Harvest Tracking

**User Story:** As a gardener, I want to log and view plant events on a calendar, so that I can track planting dates, watering schedules, and harvest milestones.

#### Acceptance Criteria

1. WHEN a user creates a calendar event with a valid plantId, event type, and date, THE App SHALL persist the CalendarEvent to DynamoDB and display it on the calendar
2. WHEN a user views the calendar for a specific plant, THE App SHALL display only the CalendarEvent records associated with that plant's ID
3. WHEN a user updates a calendar event, THE App SHALL persist the updated CalendarEvent to DynamoDB
4. WHEN a user deletes a calendar event, THE App SHALL remove it from the event list and delete it from DynamoDB
5. THE App SHALL support the following event types: `planted`, `fertilized`, `harvested`, `watered`, `pruned`, and `custom`
6. WHEN a plant is deleted, THE App SHALL retain associated CalendarEvent records in an orphaned state rather than cascade-deleting them, and THE App SHALL hide orphaned events from normal calendar views while preserving them in the database

---

### Requirement 5: Photo Capture and Storage

**User Story:** As a gardener, I want to capture or import photos and associate them with my gardens and plants, so that I can visually document growth over time.

#### Acceptance Criteria

1. WHEN a user selects "Take Photo", THE App SHALL request camera permission and open the device camera
2. WHEN a user selects "Choose from Gallery", THE App SHALL request media library permission and open the device photo gallery
3. WHEN a photo is captured or selected, THE App SHALL store the image locally using expo-file-system before initiating an upload
4. WHEN a photo is stored locally, THE App SHALL request a presigned S3 URL from the API and upload the image binary to S3
5. WHEN the S3 upload succeeds, THE App SHALL persist the photo metadata (gardenId, plantId, s3Key, takenAt) to DynamoDB
6. IF the S3 presigned URL request fails, THEN THE App SHALL retain the photo in local storage only and display a retry option to the user
7. IF the S3 upload returns a non-200 status after a successful presigned URL request, THEN THE App SHALL retain the photo in local storage only and display a retry option to the user
8. WHEN a user deletes a photo, THE App SHALL remove the photo from the list, delete the S3 object, and delete the DynamoDB metadata record
9. THE App SHALL display a thumbnail of the most recent photo on each PlantCard where a photo is available

---

### Requirement 6: Weather Display

**User Story:** As a gardener, I want to see current weather conditions for my garden's location, so that I can make informed decisions about watering and planting.

#### Acceptance Criteria

1. WHEN the WeatherWidget loads with `useDeviceLocation` enabled and location permission is granted, THE App SHALL fetch current weather using the device's GPS coordinates
2. WHEN the WeatherWidget loads with a `zipCode` provided, THE App SHALL fetch current weather using that zip code
3. WHEN weather data is successfully fetched, THE WeatherWidget SHALL display the temperature, condition description, and weather icon
4. WHEN a weather fetch succeeds, THE App SHALL cache the WeatherResponse for up to 10 minutes in LocalStorage
5. WHILE a cached WeatherResponse is less than 10 minutes old, THE App SHALL serve the cached data without making a new API call
6. WHEN the cached WeatherResponse is 10 or more minutes old, THE App SHALL trigger a background refresh before the next render
7. IF the background refresh triggered by a stale cache fails, THEN THE WeatherWidget SHALL display an error state rather than serving the stale cached data
8. IF the weather API call fails, THEN THE WeatherWidget SHALL display an error state without crashing
9. IF the user denies location permission, THEN THE App SHALL prompt the user to enter a zip code as a fallback and save the preference to LocalStorage

---

### Requirement 7: User Authentication

**User Story:** As a user, I want to securely sign in to the app, so that my garden data is private and accessible only to me.

#### Acceptance Criteria

1. THE App SHALL authenticate users via AWS Cognito before allowing access to any garden, plant, calendar, or photo data
2. WHEN a user's Cognito JWT token expires, THE App SHALL automatically refresh the token without requiring the user to sign in again
3. IF automatic token refresh fails, THEN THE App SHALL prompt the user to sign in again
4. THE API SHALL reject all requests that do not include a valid Cognito JWT token
5. WHEN a user signs out, THE App SHALL clear all locally cached user data and return to the sign-in screen

---

### Requirement 8: Offline Support and Sync

**User Story:** As a gardener, I want the app to work when I'm offline, so that I can access and update my garden data without an internet connection.

#### Acceptance Criteria

1. WHILE the device has no network connectivity, THE App SHALL serve garden, plant, and calendar data from LocalStorage
2. WHILE the device has no network connectivity, THE App SHALL queue any create, update, or delete mutations locally
3. WHEN network connectivity is restored, THE App SHALL automatically sync queued mutations to the API using exponential backoff retry
4. WHEN the device is offline, THE App SHALL display an "Offline" banner to inform the user
5. IF an API call fails due to a network timeout, THEN THE App SHALL fall back to cached local data and display an appropriate status indicator
6. WHEN recent API timeouts indicate the network is unreliable, THE App SHALL temporarily skip further API calls and serve data from LocalStorage until connectivity is confirmed restored

---

### Requirement 9: Error Handling and Resilience

**User Story:** As a user, I want the app to handle errors gracefully, so that failures in one area don't crash the entire application.

#### Acceptance Criteria

1. IF a Lambda function returns a 5xx error, THEN THE App SHALL display an error toast and offer a retry action
2. IF DynamoDB throttles a request, THEN THE App SHALL retry the request with exponential backoff
3. WHEN an error occurs in a hook, THE App SHALL set the hook's `error` state and continue operating without crashing
4. WHEN invalid garden dimensions are submitted, THE App SHALL display an inline validation error and make no API call
5. IF a photo upload fails, THEN THE App SHALL preserve the locally stored photo and allow the user to retry the upload

---

### Requirement 10: Data Serialization and Persistence

**User Story:** As a developer, I want all data models to be reliably serialized and deserialized, so that data integrity is maintained across local storage and remote persistence.

#### Acceptance Criteria

1. WHEN a Plant, Garden, CalendarEvent, or Photo object is serialized to JSON for DynamoDB storage, THE App SHALL produce a valid JSON representation of the object
2. WHEN a JSON payload is retrieved from DynamoDB and deserialized, THE App SHALL produce an object equivalent to the original before serialization
3. WHEN a Garden's grid cell map is exported as a base64 PNG snapshot, THE App SHALL produce a valid PNG that accurately represents the current cell state
4. THE App SHALL validate all incoming API payloads against their Zod schemas before processing
