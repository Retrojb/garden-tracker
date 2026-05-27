# Requirements Document

## Introduction

A low-fidelity login screen that establishes the authentication flow structure for the Garden Tracker app. This screen serves as the entry point for the authentication layer, providing email/password input fields and a sign-in action. It uses placeholder logic (no real backend auth) to scaffold the navigation gating pattern — unauthenticated users see the login screen, authenticated users proceed to the drawer navigation. The Auth_Context consumes an Auth_Provider interface so the placeholder implementation can be swapped for an AWS Cognito/Amplify-backed provider without modifying consuming components.

## Glossary

- **Login_Screen**: The screen component that renders the authentication form UI with email and password fields and a sign-in button
- **Auth_Context**: A React context provider that exposes the current authentication state and sign-in/sign-out actions to the component tree, delegating auth operations to the configured Auth_Provider
- **Auth_Provider**: A TypeScript interface defining the contract for authentication operations (sign-in, sign-out, session retrieval, token refresh). Implementations include a Placeholder_Provider for local development and a future Cognito_Provider backed by AWS Amplify
- **Placeholder_Provider**: The default Auth_Provider implementation that simulates authentication locally without network calls, used during LoFi development
- **Cognito_Provider**: A future Auth_Provider implementation that delegates authentication to AWS Cognito via aws-amplify, supporting IAM group-based authorization
- **Auth_Session**: An object representing the current authentication session, containing access token, refresh token, token expiration, and user group memberships
- **Auth_Guard**: The routing logic in the root layout that redirects users to the Login_Screen when unauthenticated, or to the main drawer navigation when authenticated
- **User**: A person interacting with the Garden Tracker application

## Requirements

### Requirement 1: Display Login Form

**User Story:** As a User, I want to see a login form when I open the app unauthenticated, so that I can enter my credentials to access the app.

#### Acceptance Criteria

1. WHEN the app launches and no valid authentication session exists, THE Login_Screen SHALL display an email text input field with email keyboard type, a password text input field with masked input, and a sign-in button
2. THE Login_Screen SHALL display a heading containing the application name
3. THE Login_Screen SHALL center the form content vertically and horizontally on the screen
4. THE Login_Screen SHALL render the form at a maximum width of 480 pixels on viewports wider than 480 pixels, and at full width with 16 pixels of horizontal padding on viewports 480 pixels or narrower
5. WHILE the app is determining authentication state, THE Login_Screen SHALL display a loading indicator instead of the form

### Requirement 2: Capture User Credentials

**User Story:** As a User, I want to type my email and password into the login form, so that I can submit my credentials.

#### Acceptance Criteria

1. WHEN the User types into the email field, THE Login_Screen SHALL update the displayed email value to match the User input
2. WHEN the User types into the password field, THE Login_Screen SHALL update the displayed password value and mask the characters
3. THE Login_Screen SHALL set the email input keyboard type to email-address
4. THE Login_Screen SHALL disable autocapitalization on the email input
5. THE Login_Screen SHALL set the email input autoComplete to email and the password input autoComplete to password

### Requirement 3: Submit Credentials and Authenticate

**User Story:** As a User, I want to press the sign-in button to authenticate, so that I can access the main app content.

#### Acceptance Criteria

1. WHEN the User presses the sign-in button with both email and password fields containing at least one non-whitespace character, THE Auth_Context SHALL invoke the configured Auth_Provider signIn method with the email and password values and, upon successful resolution, set the authentication state to authenticated
2. IF the User presses the sign-in button and the email field or password field is empty or contains only whitespace, THEN THE Login_Screen SHALL display an inline validation message below each invalid field indicating that the field is required
3. WHILE the sign-in action is processing, THE Login_Screen SHALL disable the sign-in button and display a loading indicator within the button to indicate the action is in progress
4. IF the sign-in action fails, THEN THE Login_Screen SHALL re-enable the sign-in button and display an error message above the form indicating that authentication was unsuccessful

### Requirement 4: Gate Navigation Behind Authentication

**User Story:** As a User, I want the app to only show the main content after I authenticate, so that the authentication flow is enforced.

#### Acceptance Criteria

1. WHILE the Auth_Context state is unauthenticated, THE Auth_Guard SHALL render the Login_Screen and SHALL NOT render the drawer navigation or any main content screens
2. WHILE the Auth_Context state is loading (initial session check in progress), THE Auth_Guard SHALL render a loading indicator and SHALL NOT render the Login_Screen or the drawer navigation
3. WHEN the Auth_Context state transitions to authenticated, THE Auth_Guard SHALL render the main drawer navigation in place of the Login_Screen
4. WHEN the User triggers a sign-out action, THE Auth_Context SHALL set the state to unauthenticated

### Requirement 5: Provide Sign-Out Capability

**User Story:** As a User, I want to sign out from the app, so that I can end my session.

#### Acceptance Criteria

1. WHILE the User is authenticated, THE Auth_Guard SHALL expose a sign-out action accessible from the app settings or drawer
2. WHEN the User triggers the sign-out action, THE Auth_Context SHALL invoke the configured Auth_Provider signOut method and clear the local authentication state
3. WHEN the Auth_Context has completed the sign-out process, THE Auth_Guard SHALL navigate the User to the Login_Screen
4. IF the sign-out action fails due to a network or service error, THEN THE Auth_Context SHALL still clear local authentication state and navigate the User to the Login_Screen

### Requirement 6: Persist Authentication State

**User Story:** As a User, I want my login session to persist across app restarts, so that I do not need to log in every time I open the app.

#### Acceptance Criteria

1. WHEN the Auth_Context state transitions to authenticated, THE Auth_Context SHALL persist the authentication state to device storage using MMKV within 1 second of the state transition
2. WHEN the app launches, THE Auth_Context SHALL read the persisted authentication state from MMKV and, if a valid persisted state exists, restore the Auth_Context state to authenticated and allow the Auth_Guard to render the drawer navigation without requiring the User to sign in again
3. WHEN the User signs out, THE Auth_Context SHALL remove the persisted authentication state from MMKV so that subsequent app launches require the User to sign in
4. IF the persisted authentication state is absent or unreadable on app launch, THEN THE Auth_Context SHALL set the state to unauthenticated and THE Auth_Guard SHALL render the Login_Screen
5. WHILE the Auth_Context is reading the persisted state on app launch, THE Auth_Context SHALL expose a loading state and THE Auth_Guard SHALL not render the Login_Screen or the drawer navigation until the read completes within 2 seconds

### Requirement 7: Style Consistency

**User Story:** As a User, I want the login screen to match the visual style of the rest of the app, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE Login_Screen SHALL use the Manrope font family for all text elements, referencing only font weights available in the project assets (e.g., Manrope-Regular, Manrope-Medium, Manrope-Bold, Manrope-SemiBold)
2. THE Login_Screen SHALL use NativeWind className-based styling with tailwind-variants for component variants, and SHALL NOT use inline style objects or StyleSheet.create
3. THE Login_Screen SHALL use the existing Button component for the login submit action and the existing FormField component for email and password inputs
4. THE Login_Screen SHALL apply spacing, border-radius, and color values consistent with the existing tailwind-variants token definitions used in Button and FormField components

### Requirement 8: Auth Provider Abstraction for AWS IAM Integration

**User Story:** As a developer, I want the Auth_Context to consume an Auth_Provider interface, so that I can swap the placeholder auth logic for an AWS Cognito provider backed by IAM groups without changing any consuming components.

#### Acceptance Criteria

1. THE Auth_Context SHALL depend on an Auth_Provider interface rather than a concrete implementation, accepting the provider as a configuration parameter
2. THE Auth_Provider interface SHALL define a signIn method that accepts an object containing email (string) and password (string) fields and returns a Promise resolving to an Auth_Session object, compatible with AWS Cognito user pool sign-in credentials
3. THE Auth_Provider interface SHALL define a signOut method that returns a Promise resolving to void
4. THE Auth_Provider interface SHALL define a getSession method that returns a Promise resolving to an Auth_Session or null, enabling token-based session restoration
5. THE Auth_Provider interface SHALL define a refreshSession method that returns a Promise resolving to an Auth_Session, supporting access token refresh using a refresh token
6. THE Auth_Session object SHALL contain an accessToken (string), a refreshToken (string), an expiresAt (number representing Unix timestamp), and a groups field (array of strings representing IAM group memberships)
7. THE Placeholder_Provider SHALL implement the Auth_Provider interface, returning a static Auth_Session with a dummy accessToken, a dummy refreshToken, an expiresAt value 1 hour in the future, and an empty groups array
8. WHEN a Cognito_Provider is supplied to the Auth_Context, THE Auth_Context SHALL delegate signIn, signOut, getSession, and refreshSession calls to the Cognito_Provider without requiring changes to the Login_Screen, Auth_Guard, or any other consuming component
9. THE Auth_Context SHALL expose the current user groups from the Auth_Session so that consuming components can perform group-based authorization checks against IAM group membership
