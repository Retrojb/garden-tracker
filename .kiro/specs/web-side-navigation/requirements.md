# Requirements Document

## Introduction

Replace the existing bottom tab navigation with a Drawer layout using `@react-navigation/drawer` integrated with `expo-router`. The drawer navigation will serve as the primary navigation mechanism across all platforms (web, iOS, Android). On larger screens (>768px), the drawer remains permanently visible as a side navigation panel. On smaller screens, the drawer is collapsible and toggled via a hamburger menu button. The four existing screens (Dashboard, Plants, Gardens, Settings) are preserved as drawer items.

## Glossary

- **Drawer_Navigator**: The navigation component provided by `@react-navigation/drawer` integrated with `expo-router` that renders a side panel containing navigation items
- **Drawer_Item**: A single navigable entry within the Drawer_Navigator representing one screen destination
- **Collapse_Toggle**: A button (hamburger icon) that opens or closes the Drawer_Navigator on smaller screens
- **Breakpoint_Threshold**: The screen width boundary of 768px that determines whether the Drawer_Navigator is permanently visible or collapsible
- **Navigation_Screen**: One of the four primary application screens: Dashboard, Plants, Gardens, or Settings
- **App**: The garden-tracker Expo application

## Requirements

### Requirement 1

**User Story:** As a user, I want a drawer-based side navigation so that I can navigate between screens using a consistent side panel layout across all platforms.

#### Acceptance Criteria

1. THE Drawer_Navigator SHALL render four Drawer_Items corresponding to Dashboard, Plants, Gardens, and Settings screens
2. WHEN a user selects a Drawer_Item, THE Drawer_Navigator SHALL navigate to the corresponding Navigation_Screen
3. THE Drawer_Navigator SHALL display a label and an icon for each Drawer_Item
4. THE Drawer_Navigator SHALL use FontAwesome icons matching the existing icon assignments: home for Dashboard, leaf for Plants, code for Gardens, and cog for Settings

### Requirement 2

**User Story:** As a user on a large screen, I want the side navigation to always be visible so that I can quickly switch between screens without extra interaction.

#### Acceptance Criteria

1. WHILE the viewport width is greater than the Breakpoint_Threshold, THE Drawer_Navigator SHALL remain permanently visible as a fixed side panel
2. WHILE the viewport width is greater than the Breakpoint_Threshold, THE Drawer_Navigator SHALL NOT overlay the main content area
3. WHILE the viewport width is greater than the Breakpoint_Threshold, THE App SHALL render the main content adjacent to the Drawer_Navigator

### Requirement 3

**User Story:** As a user on a smaller screen, I want the side navigation to be collapsible so that screen real estate is preserved while still providing access to navigation.

#### Acceptance Criteria

1. WHILE the viewport width is equal to or less than the Breakpoint_Threshold, THE Drawer_Navigator SHALL be hidden by default
2. WHEN the user activates the Collapse_Toggle, THE Drawer_Navigator SHALL open as an overlay on the current screen
3. WHEN the user selects a Drawer_Item while the viewport width is equal to or less than the Breakpoint_Threshold, THE Drawer_Navigator SHALL close after navigation completes
4. WHILE the viewport width is equal to or less than the Breakpoint_Threshold, THE App SHALL display the Collapse_Toggle in the screen header

### Requirement 4

**User Story:** As a user, I want the drawer navigation to replace the bottom tabs so that there is a single consistent navigation pattern.

#### Acceptance Criteria

1. THE App SHALL NOT render bottom tab navigation on any platform
2. THE Drawer_Navigator SHALL serve as the sole primary navigation mechanism for all platforms (web, iOS, Android)
3. THE App SHALL set Dashboard as the initial route within the Drawer_Navigator

### Requirement 5

**User Story:** As a user, I want the drawer navigation to integrate with the existing app structure so that detail screens and other routes continue to function correctly.

#### Acceptance Criteria

1. WHEN a user navigates to a detail screen (plant detail or garden detail), THE App SHALL render the detail screen within the existing Stack navigator above the Drawer_Navigator
2. THE App SHALL preserve the existing header behavior for detail screens including back navigation
3. THE Drawer_Navigator SHALL highlight the active Drawer_Item corresponding to the currently displayed Navigation_Screen

### Requirement 6

**User Story:** As a developer, I want the drawer navigation implemented using expo-router's Drawer layout so that it follows the file-based routing conventions of the project.

#### Acceptance Criteria

1. THE App SHALL use the Drawer layout component from expo-router for the primary navigation structure
2. THE App SHALL define drawer screens using expo-router file-based routing conventions
3. THE App SHALL install and configure `@react-navigation/drawer` as a dependency for the Drawer layout
