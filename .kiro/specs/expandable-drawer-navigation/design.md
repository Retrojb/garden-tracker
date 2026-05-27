# Design Document: Expandable Drawer Navigation

## Overview

This design describes the expandable drawer navigation feature, which enhances the existing drawer sidebar by adding expandable/collapsible sections beneath the "Plants" and "Gardens" parent items. Each section dynamically displays sub-items fetched from existing data hooks, with smooth animated height transitions powered by React Native Reanimated.

## Architecture

The expandable drawer navigation extends the existing `@react-navigation/drawer` layout by injecting a custom `drawerContent` component. This component replaces the default drawer item list with a tree structure that supports expandable/collapsible sections for Plants and Gardens, while preserving standard behavior for Dashboard and Settings.

The architecture follows a composition pattern:

```
DrawerLayout (_layout.tsx)
└── CustomDrawerContent (replaces default content)
    ├── DrawerParentItem (Dashboard, Settings — non-expandable)
    └── ExpandableDrawerSection (Plants, Gardens)
        ├── Label area → navigates to list screen
        ├── ChevronToggle → toggles expand/collapse
        └── AnimatedSubItemList (collapsible container)
            └── DrawerSubItem[] (one per data record)
```

State management uses local React state (`useState`) for expand/collapse toggles, with Reanimated shared values driving the height and rotation animations. Data flows from the existing `usePlants()` and `useGardens()` Zustand-backed hooks.

## Components and Interfaces

### 1. CustomDrawerContent

**Location:** `src/components/navigation/CustomDrawerContent.tsx`

The root custom drawer content component. Receives `DrawerContentComponentProps` from `@react-navigation/drawer` and renders all navigation items.

```tsx
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    plants: false,
    gardens: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerParentItem
        label="Dashboard"
        icon="home"
        isActive={/* derived from navigation state */}
        onPress={/* navigate to index */}
      />
      <ExpandableDrawerSection
        label="Plants"
        icon="leaf"
        isExpanded={expandedSections.plants}
        onToggle={() => toggleSection('plants')}
        onLabelPress={/* navigate to plants */}
        isActive={/* derived from navigation state */}
      >
        {/* Sub-items rendered inside */}
      </ExpandableDrawerSection>
      <ExpandableDrawerSection
        label="Gardens"
        icon="tree"
        isExpanded={expandedSections.gardens}
        onToggle={() => toggleSection('gardens')}
        onLabelPress={/* navigate to gardens */}
        isActive={/* derived from navigation state */}
      >
        {/* Sub-items rendered inside */}
      </ExpandableDrawerSection>
      <DrawerParentItem
        label="Settings"
        icon="cog"
        isActive={/* derived from navigation state */}
        onPress={/* navigate to settings */}
      />
    </DrawerContentScrollView>
  );
};

export { CustomDrawerContent };
```

### 2. DrawerParentItem

**Location:** `src/components/navigation/DrawerParentItem.tsx`

A non-expandable drawer item for Dashboard and Settings. Renders an icon, label, and handles tap-to-navigate.

```tsx
interface DrawerParentItemProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}

const DrawerParentItem = ({ label, icon, isActive, onPress }: DrawerParentItemProps) => {
  return (
    <Pressable onPress={onPress} className={/* active/inactive styles */}>
      <FontAwesome name={icon} size={20} />
      <Text>{label}</Text>
    </Pressable>
  );
};

export { DrawerParentItem };
```

### 3. ExpandableDrawerSection

**Location:** `src/components/navigation/ExpandableDrawerSection.tsx`

An expandable parent item with split tap targets: label area navigates, chevron toggles expansion. Contains the animated collapsible container for sub-items.

```tsx
interface ExpandableDrawerSectionProps {
  label: string;
  icon: string;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onLabelPress: () => void;
  children: React.ReactNode;
}

const ExpandableDrawerSection = ({
  label,
  icon,
  isExpanded,
  isActive,
  onToggle,
  onLabelPress,
  children,
}: ExpandableDrawerSectionProps) => {
  return (
    <View>
      <View className="flex-row items-center">
        <Pressable onPress={onLabelPress} className="flex-1 flex-row items-center">
          <FontAwesome name={icon} size={20} />
          <Text>{label}</Text>
        </Pressable>
        <ChevronToggle isExpanded={isExpanded} onPress={onToggle} />
      </View>
      <AnimatedSubItemList isExpanded={isExpanded}>
        {children}
      </AnimatedSubItemList>
    </View>
  );
};

export { ExpandableDrawerSection };
```

### 4. ChevronToggle

**Location:** `src/components/navigation/ChevronToggle.tsx`

An animated chevron icon button with a 44x44dp minimum tap target. Rotates between right-pointing (collapsed) and down-pointing (expanded) using Reanimated.

```tsx
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface ChevronToggleProps {
  isExpanded: boolean;
  onPress: () => void;
}

const ChevronToggle = ({ isExpanded, onPress }: ChevronToggleProps) => {
  const rotation = useSharedValue(isExpanded ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 90 : 0, { duration: 300 });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      className="w-11 h-11 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? 'Collapse section' : 'Expand section'}
    >
      <Animated.View style={animatedStyle}>
        <FontAwesome name="chevron-right" size={14} />
      </Animated.View>
    </Pressable>
  );
};

export { ChevronToggle };
```

### 5. AnimatedSubItemList

**Location:** `src/components/navigation/AnimatedSubItemList.tsx`

A container that animates its height between 0 and measured content height using Reanimated. Uses `onLayout` to measure content and `overflow: 'hidden'` to prevent clipping during transitions.

```tsx
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AnimatedSubItemListProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

const AnimatedSubItemList = ({ isExpanded, children }: AnimatedSubItemListProps) => {
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? contentHeight.value : 0, { duration: 300 });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  return (
    <Animated.View style={animatedStyle}>
      <View onLayout={onLayout} style={{ position: 'absolute', width: '100%' }}>
        {children}
      </View>
    </Animated.View>
  );
};

export { AnimatedSubItemList };
```

### 6. DrawerSubItem

**Location:** `src/components/navigation/DrawerSubItem.tsx`

A single sub-item representing a plant or garden record. Displays the item name and navigates to the detail route on tap.

```tsx
interface DrawerSubItemProps {
  label: string;
  routePath: string;
  isActive: boolean;
  onPress: () => void;
}

const DrawerSubItem = ({ label, routePath, isActive, onPress }: DrawerSubItemProps) => {
  return (
    <Pressable onPress={onPress} className={/* indented, active/inactive styles */}>
      <Text>{label}</Text>
    </Pressable>
  );
};

export { DrawerSubItem };
```

## Data Models

### Existing Models (unchanged)

- **IPlant** (`src/types/TPlant.ts`): `{ id: string, name?: string, species?: string, variety?: string, gardenId: string, createdAt: string, updatedAt: string }`
- **IGarden** (`src/types/TGarden.ts`): `{ id: string, name: string, type: TGardenType, size: string, dimensions: IGardenDimensions, createdAt: string, updatedAt: string }`

### New Types

**Location:** `src/components/navigation/types.ts`

```tsx
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

/** Identifies which sections support expand/collapse */
type ExpandableSectionKey = 'plants' | 'gardens';

/** State map tracking which sections are expanded */
type ExpandedSectionsState = Record<ExpandableSectionKey, boolean>;

/** Props for the non-expandable parent drawer item */
interface IDrawerParentItemProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}

/** Props for the expandable section component */
interface IExpandableDrawerSectionProps {
  label: string;
  icon: string;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onLabelPress: () => void;
  children: React.ReactNode;
}

/** Props for the chevron toggle button */
interface IChevronToggleProps {
  isExpanded: boolean;
  onPress: () => void;
}

/** Props for the animated collapsible container */
interface IAnimatedSubItemListProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

/** Props for a single sub-item in the drawer */
interface IDrawerSubItemProps {
  label: string;
  routePath: string;
  isActive: boolean;
  onPress: () => void;
}

export type {
  ExpandableSectionKey,
  ExpandedSectionsState,
  IDrawerParentItemProps,
  IExpandableDrawerSectionProps,
  IChevronToggleProps,
  IAnimatedSubItemListProps,
  IDrawerSubItemProps,
};
```

## Data Flow

```
usePlants() ──→ plants: IPlant[] ──→ CustomDrawerContent ──→ ExpandableDrawerSection (Plants)
                                                                └── DrawerSubItem (per plant)

useGardens() ──→ gardens: IGarden[] ──→ CustomDrawerContent ──→ ExpandableDrawerSection (Gardens)
                                                                  └── DrawerSubItem (per garden)
```

- `usePlants()` is called without a `gardenId` argument to fetch all plants.
- `useGardens()` returns all gardens.
- Both hooks expose `isLoading` for loading state display.
- The `name` field from `IPlant` (optional, falls back to species or "Unnamed Plant") and `IGarden` (required) is used as the sub-item label.
- The `id` field is used to construct detail routes: `/plants/${id}` or `/gardens/${id}`.

## Navigation Integration

The `CustomDrawerContent` is wired into the existing drawer layout via the `drawerContent` prop:

```tsx
// app/(drawer)/_layout.tsx
<Drawer
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={{ /* existing options */ }}
>
  {/* existing Drawer.Screen definitions unchanged */}
</Drawer>
```

**Active state detection** uses the navigation state from `DrawerContentComponentProps`:
- Parent items: compare route name against `state.routes[state.index].name`
- Sub-items: use `usePathname()` from `expo-router` to match `/plants/[id]` or `/gardens/[id]` patterns

**Navigation calls** use `router.push()` from `expo-router` for sub-item detail routes (outside the drawer group) and `navigation.navigate()` for drawer screen routes.

**Drawer close on mobile**: After sub-item navigation on screens ≤768dp, call `navigation.closeDrawer()` from the drawer props.

## Animation Details

| Animation | Library | Duration | Easing |
|-----------|---------|----------|--------|
| Height expand/collapse | react-native-reanimated `withTiming` | 300ms | Default (ease-in-out) |
| Chevron rotation | react-native-reanimated `withTiming` | 300ms | Default (ease-in-out) |

**Height measurement strategy:**
1. Render children in an absolutely-positioned inner `View` with `onLayout`
2. Store measured height in a Reanimated shared value
3. Animate the outer `Animated.View` height between 0 and the measured value
4. Use `overflow: 'hidden'` on the outer container to clip during transition

This avoids layout jumps because the animated container occupies exact space in the layout flow, and adjacent items reflow smoothly as the height animates.

## Loading and Empty States

Within each `ExpandableDrawerSection`, the children slot renders conditionally:

| Condition | Rendered Content |
|-----------|-----------------|
| `isLoading === true` | `<ActivityIndicator size="small" />` centered in section |
| `items.length === 0` | `<Text>` with "No plants yet" / "No gardens yet" message |
| `items.length > 0` | `<DrawerSubItem />` for each item |

## Error Handling

- If `usePlants()` or `useGardens()` returns an error, the expanded section displays the empty state (graceful degradation).
- Navigation to a non-existent detail route is handled by the existing `+not-found.tsx` catch-all.
- If `IPlant.name` is undefined/empty, fall back to `species` field or "Unnamed Plant" as the sub-item label.

## Responsive Behavior

The existing `BREAKPOINT = 768` logic in `_layout.tsx` is preserved. The `CustomDrawerContent` component is agnostic to drawer type — it renders identically whether the drawer is permanent or overlay. The expand/collapse state lives in React state within `CustomDrawerContent`, which persists across drawer open/close cycles and layout transitions because the component remains mounted.

## File Structure

```
src/components/navigation/
├── types.ts                      (shared types for navigation components)
├── CustomDrawerContent.tsx       (root custom drawer content)
├── DrawerParentItem.tsx          (non-expandable item)
├── ExpandableDrawerSection.tsx   (expandable parent with split tap)
├── ChevronToggle.tsx             (animated chevron button)
├── AnimatedSubItemList.tsx       (animated height container)
├── DrawerSubItem.tsx             (individual sub-item)
└── PageHeader.tsx                (existing, unchanged)
```

## Testing Strategy

### Unit Tests (Example-Based)
- Verify parent items render in correct order (Dashboard, Plants, Gardens, Settings)
- Verify chevron icons appear only on Plants and Gardens
- Verify label tap triggers navigation to correct list screen
- Verify chevron tap target is at least 44x44dp
- Verify loading indicator displays when `isLoading` is true
- Verify empty state messages display when data arrays are empty
- Verify drawer type switches at 768dp breakpoint
- Verify drawer closes after sub-item navigation on mobile

### Property Tests (Universal)
- Toggle idempotence (toggle twice = original state)
- Chevron tap isolation (never triggers navigation)
- Sub-item count invariant (count = data array length)
- Label correctness (sub-item label = record name)
- Route construction (sub-item tap → correct detail route)
- Active state exclusivity (exactly one sub-item highlighted per active route)
- State preservation across layout transitions

### Integration Tests
- Animation height transitions (Reanimated worklet behavior)
- Chevron rotation animation
- Full navigation flow from drawer to detail screen

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Toggle is its own inverse

*For any* expandable section in any expand/collapse state, toggling the section twice SHALL return it to its original state (expanded→collapsed→expanded, or collapsed→expanded→collapsed).

**Validates: Requirements 2.2**

### Property 2: Chevron tap never triggers navigation

*For any* expandable parent item in any state (expanded or collapsed), tapping the chevron toggle SHALL never invoke a navigation action — only the expand/collapse state changes.

**Validates: Requirements 2.2, 2.3**

### Property 3: Sub-item count equals data length

*For any* non-empty array of items returned by `usePlants()` or `useGardens()`, when the corresponding section is expanded, the number of rendered `DrawerSubItem` components SHALL equal the length of the data array.

**Validates: Requirements 4.1, 4.2**

### Property 4: Sub-item label matches record name

*For any* `IPlant` or `IGarden` record with a defined `name` field, the corresponding `DrawerSubItem` label text SHALL exactly match that `name` value.

**Validates: Requirements 4.3**

### Property 5: Sub-item navigation produces correct route

*For any* plant sub-item with id `X`, tapping it SHALL navigate to `/plants/X`. *For any* garden sub-item with id `Y`, tapping it SHALL navigate to `/gardens/Y`. The route is deterministically constructed from the item type and id field.

**Validates: Requirements 5.1, 5.2**

### Property 6: Active route highlights corresponding sub-item

*For any* current pathname matching `/plants/[id]` or `/gardens/[id]`, exactly one `DrawerSubItem` whose `routePath` matches the current pathname SHALL receive active/highlighted styling, and all other sub-items SHALL not.

**Validates: Requirements 7.1**

### Property 7: Expand/collapse state preserved across layout transitions

*For any* expand/collapse state configuration, when the screen width crosses the 768dp breakpoint (triggering a drawer type change between permanent and overlay), the expand/collapse state of all sections SHALL remain unchanged.

**Validates: Requirements 8.3**
