# Design Document

## Overview

This design replaces the existing bottom tab navigation with a Drawer-based side navigation using `@react-navigation/drawer` integrated with `expo-router`. The drawer serves as the sole primary navigation across all platforms. It adapts responsively: permanently visible on viewports wider than 768px, and collapsible (overlay) on smaller viewports.

## Architecture

### Navigation Hierarchy

```
RootLayout (Stack)
├── (drawer) layout (Drawer Navigator)
│   ├── index.tsx        → Dashboard screen
│   ├── plants.tsx       → Plants screen
│   ├── gardens.tsx      → Gardens screen
│   └── settings.tsx     → Settings screen
├── plants/[id].tsx      → Plant detail (Stack screen)
└── gardens/[id].tsx     → Garden detail (Stack screen)
```

The existing `(tabs)` route group is replaced by a `(drawer)` route group. The root `Stack` navigator remains to handle detail screens that render above the drawer.

### Responsive Behavior

The drawer type is determined by viewport width using a `useWindowDimensions` hook:

- **Width > 768px**: `drawerType: "permanent"` — drawer is always visible, content renders adjacent
- **Width <= 768px**: `drawerType: "front"` — drawer is hidden by default, opens as overlay via toggle button

## Components and Interfaces

### DrawerLayout (`app/(drawer)/_layout.tsx`)

The primary layout component that configures the `Drawer` navigator from `expo-router`.

```typescript
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';

const BREAKPOINT = 768;

const DrawerLayout = (): React.ReactElement => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > BREAKPOINT;

  return (
    <Drawer
      screenOptions={{
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerStyle: {
          width: 240,
        },
        headerShown: !isLargeScreen,
        headerLeft: !isLargeScreen ? undefined : () => null,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => <FontAwesome name="home" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="plants"
        options={{
          title: 'Plants',
          drawerIcon: ({ color }) => <FontAwesome name="leaf" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="gardens"
        options={{
          title: 'Gardens',
          drawerIcon: ({ color }) => <FontAwesome name="code" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => <FontAwesome name="cog" size={20} color={color} />,
        }}
      />
    </Drawer>
  );
};

export { DrawerLayout as default };
```

### Updated RootLayout (`app/_layout.tsx`)

The root layout changes `initialRouteName` from `(tabs)` to `(drawer)` and updates the Stack screen registration.

```typescript
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../index.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

SplashScreen.preventAutoHideAsync();

const RootLayout = (): React.ReactElement | null => {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
};

const RootLayoutNav = (): React.ReactElement => {
  return (
    <Stack>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="plants/[id]" options={{ title: 'Plant Detail' }} />
      <Stack.Screen name="gardens/[id]" options={{ title: 'Garden Detail' }} />
    </Stack>
  );
};

export { RootLayout as default };
```

### Interfaces

#### Drawer Configuration Interface

```typescript
interface DrawerConfig {
  breakpoint: number;           // 768
  drawerWidth: number;          // 240
  screens: DrawerScreenConfig[];
}

interface DrawerScreenConfig {
  name: string;                 // file-based route name
  title: string;                // display label
  iconName: string;             // FontAwesome icon name
}
```

### Navigation Items

| Route Name | Title      | Icon   |
|-----------|-----------|--------|
| index     | Dashboard | home   |
| plants    | Plants    | leaf   |
| gardens   | Gardens   | code   |
| settings  | Settings  | cog    |

## Data Models

No new data models are introduced. This feature modifies navigation structure only.

## Error Handling

| Scenario | Handling |
|----------|----------|
| Font loading failure | Existing `ErrorBoundary` from expo-router catches and displays error |
| Invalid route navigation | expo-router's `+not-found.tsx` handles unknown routes |
| Drawer gesture conflicts | `react-native-gesture-handler` manages gesture priority (already installed) |
| Window dimensions unavailable | Default to collapsible mode (`drawerType: 'front'`) as safe fallback |

## File Changes Summary

| Action | Path | Purpose |
|--------|------|---------|
| Create | `app/(drawer)/_layout.tsx` | Drawer navigator layout |
| Move   | `app/(tabs)/index.tsx` → `app/(drawer)/index.tsx` | Dashboard screen |
| Move   | `app/(tabs)/plants.tsx` → `app/(drawer)/plants.tsx` | Plants screen |
| Move   | `app/(tabs)/gardens.tsx` → `app/(drawer)/gardens.tsx` | Gardens screen |
| Move   | `app/(tabs)/settings.tsx` → `app/(drawer)/settings.tsx` | Settings screen |
| Delete | `app/(tabs)/_layout.tsx` | Remove old tab layout |
| Modify | `app/_layout.tsx` | Update initialRouteName and Stack screen name |
| Add    | `package.json` | Add `@react-navigation/drawer` dependency |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/drawer` | Drawer navigator implementation required by expo-router's Drawer |
| `react-native-gesture-handler` | Already installed — required for drawer gestures |
| `react-native-reanimated` | Already installed — required for drawer animations |

## Testing Strategy

### Unit Tests (Example-Based)

Unit tests cover the bounded, specific behaviors:

- **Drawer item rendering**: Verify all four items (Dashboard, Plants, Gardens, Settings) render with correct labels and FontAwesome icons
- **Icon mapping**: Verify each screen maps to the correct icon (home, leaf, code, cog)
- **Navigation**: Verify selecting each drawer item navigates to the corresponding screen
- **No bottom tabs**: Verify the app does not render a bottom tab bar
- **Initial route**: Verify Dashboard is the initial screen
- **Detail screen navigation**: Verify plant/garden detail screens render in the Stack navigator with back navigation
- **Toggle interaction**: Verify the collapse toggle opens the drawer as overlay on small screens

### Property Tests

Property tests cover responsive behavior across the continuous range of viewport widths:

- **Large screen mode** (Property 1): Generate random widths > 768 and verify permanent drawer behavior
- **Small screen mode** (Property 2): Generate random widths <= 768 and verify collapsible drawer behavior
- **Auto-close** (Property 3): For any item at small widths, verify drawer closes after selection
- **Active highlighting** (Property 4): For any active screen, verify the corresponding item is highlighted

### Test Configuration

- Framework: Jest with `@testing-library/react-native`
- Property testing: `fast-check` (already installed)
- Minimum 100 iterations per property test

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Large screen permanent drawer mode

*For any* viewport width greater than 768px, the drawer navigator SHALL operate in permanent mode — rendering as a fixed, non-overlaying side panel with main content positioned adjacent to it.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Small screen collapsible drawer mode

*For any* viewport width less than or equal to 768px, the drawer navigator SHALL be hidden by default and a collapse toggle button SHALL be present in the screen header.

**Validates: Requirements 3.1, 3.4**

### Property 3: Auto-close on small screen navigation

*For any* drawer item selection when the viewport width is less than or equal to 768px, the drawer SHALL close after navigation completes.

**Validates: Requirements 3.3**

### Property 4: Active item highlighting

*For any* currently displayed navigation screen, the corresponding drawer item SHALL be visually highlighted as active.

**Validates: Requirements 5.3**
