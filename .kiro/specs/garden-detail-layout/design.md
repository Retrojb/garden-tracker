# Design Document

## Overview

The garden detail layout feature builds the `app/gardens/[id].tsx` screen into a fully functional detail page. It displays a heading card with the garden name, a wrapping row of compact plant cards, and an empty state when no plants exist. A new `usePlants` hook provides plant data filtered by garden ID, following the established Zustand + MMKV caching pattern from `useGardens`.

## Architecture

### Component Hierarchy

```
GardenDetailScreen (app/gardens/[id].tsx)
├── HeadingCard (Card variant="basic" with garden name)
├── PlantRow (flex-wrap container)
│   └── PlantCard[] (Card variant="compact" with plant name)
└── EmptyState (shown when plants.length === 0 and not loading)
```

### Data Flow

```
[id] param → useGardens (find garden by ID) → HeadingCard
[id] param → usePlants(gardenId) → PlantRow / EmptyState
```

The page extracts the `id` from Expo Router's `useLocalSearchParams`, uses `useGardens` to resolve the garden name for the heading, and `usePlants(id)` to fetch the associated plants.

## Components and Interfaces

### GardenDetailScreen

The root screen component at `app/gardens/[id].tsx`. Orchestrates data fetching and conditionally renders loading, populated, or empty states.

```typescript
// app/gardens/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'

import { Card } from '@/src/components/Card'
import { EmptyState } from '@/src/components/EmptyState'
import { PlantRow } from '@/src/components/PlantRow'
import { useGardens } from '@/src/hooks/useGardens'
import { usePlants } from '@/src/hooks/usePlants'

const GardenDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { gardens, isLoading: gardensLoading } = useGardens()
  const { plants, isLoading: plantsLoading } = usePlants(id ?? '')

  const garden = gardens.find((g) => g.id === id)
  const isLoading = gardensLoading || plantsLoading

  if (isLoading) {
    return <ActivityIndicator />
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Card title={garden?.name} variant="basic" />
      {plants.length > 0 ? (
        <PlantRow plants={plants} />
      ) : (
        <EmptyState message="No plants yet" />
      )}
    </ScrollView>
  )
}

export default GardenDetailScreen
```

### PlantRow

A flex-wrap container that renders one compact Card per plant.

```typescript
// src/components/PlantRow.tsx
import React from 'react'
import { View } from 'react-native'

import { Card } from '@/src/components/Card'
import type { IPlantRowProps } from '@/src/types/TPlantRow'

const PlantRow = ({ plants, className }: IPlantRowProps) => {
  return (
    <View className={`flex-row flex-wrap mt-4 ${className ?? ''}`}>
      {plants.map((plant) => (
        <Card key={plant.id} title={plant.name} variant="compact" />
      ))}
    </View>
  )
}

export { PlantRow }
```

### EmptyState

A generic empty state component with a message and an add action.

```typescript
// src/components/EmptyState.tsx
import React from 'react'
import { Pressable, Text, View } from 'react-native'

import type { IEmptyStateProps } from '@/src/types/TEmptyState'

const EmptyState = ({ message, onAdd, className }: IEmptyStateProps) => {
  return (
    <View className={`items-center justify-center py-12 ${className ?? ''}`}>
      <Text className="text-gray-400 text-base mb-4">{message}</Text>
      {onAdd && (
        <Pressable
          onPress={onAdd}
          className="bg-indigo-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Plant</Text>
        </Pressable>
      )}
    </View>
  )
}

export { EmptyState }
```

## Data Models

### IPlant (updated)

```typescript
// src/types/TPlant.ts
interface IPlant {
  id: string
  name?: string
  species?: string
  variety?: string
  gardenId: string  // NEW — references the associated garden
  createdAt: string
  updatedAt: string
}
```

### IPlantRowProps

```typescript
// src/types/TPlantRow.ts
import type { IPlant } from './TPlant'

interface IPlantRowProps {
  plants: IPlant[]
  className?: string
}

export type { IPlantRowProps }
```

### IEmptyStateProps

```typescript
// src/types/TEmptyState.ts
interface IEmptyStateProps {
  message: string
  onAdd?: () => void
  className?: string
}

export type { IEmptyStateProps }
```

### UsePlantsResult

```typescript
// src/types/TUsePlants.ts
import type { IPlant } from './TPlant'

interface UsePlantsResult {
  plants: IPlant[]
  isLoading: boolean
  error: Error | null
  refreshPlants: () => Promise<void>
}

export type { UsePlantsResult }
```

## usePlants Hook

Follows the same Zustand + MMKV pattern as `useGardens`. Accepts a `gardenId` parameter and returns only plants matching that garden.

```typescript
// src/hooks/usePlants.ts
import { useCallback, useEffect } from 'react'
import { create } from 'zustand'

import { API_ROUTES } from '@/src/constants/api'
import { apiClient } from '@/src/lib/apiClient'
import { get as storageGet, set as storageSet } from '@/src/lib/storage'
import type { IPlant } from '@/src/types/TPlant'
import type { UsePlantsResult } from '@/src/types/TUsePlants'

const PLANTS_CACHE_KEY = (gardenId: string) => `plants_cache_${gardenId}`

interface PlantsState {
  plants: IPlant[]
  isLoading: boolean
  error: Error | null
  _setPlants: (plants: IPlant[]) => void
  _setLoading: (isLoading: boolean) => void
  _setError: (error: Error | null) => void
}

const usePlantsStore = create<PlantsState>((set) => ({
  plants: [],
  isLoading: false,
  error: null,
  _setPlants: (plants) => set({ plants }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setError: (error) => set({ error }),
}))

const usePlants = (gardenId: string): UsePlantsResult => {
  const { plants, isLoading, error, _setPlants, _setLoading, _setError } =
    usePlantsStore()

  const refreshPlants = useCallback(async (): Promise<void> => {
    _setLoading(true)
    _setError(null)

    try {
      const response = await apiClient.get<IPlant[]>(
        `${API_ROUTES.PLANTS}?gardenId=${gardenId}`
      )
      const filtered = response.data.filter((p) => p.gardenId === gardenId)
      _setPlants(filtered)
      storageSet<IPlant[]>(PLANTS_CACHE_KEY(gardenId), filtered)
    } catch {
      // Serve from cache on failure (offline)
      const cached = storageGet<IPlant[]>(PLANTS_CACHE_KEY(gardenId))
      if (cached) {
        _setPlants(cached)
      } else {
        _setError(new Error('Failed to fetch plants'))
      }
    } finally {
      _setLoading(false)
    }
  }, [gardenId, _setPlants, _setLoading, _setError])

  useEffect(() => {
    if (gardenId) {
      void refreshPlants()
    }
  }, [gardenId, refreshPlants])

  return { plants, isLoading, error, refreshPlants }
}

export { usePlants }
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Garden ID not found in store | Heading card renders with no title; page still shows plant section |
| API fetch fails (online) | Attempt to serve from MMKV cache; if no cache, set `error` state |
| Device offline | Serve plants from MMKV cache keyed by gardenId |
| Empty plant list (not loading) | Render EmptyState with message and add action |
| Loading state | Show ActivityIndicator, suppress empty state |

## Testing Strategy

### Unit Tests (Example-Based)

- **Heading Card variant**: Verify the Card renders with `variant="basic"` (Req 1.2)
- **Loading state**: Verify ActivityIndicator renders when `isLoading` is true (Req 1.3)
- **Plant Row layout styles**: Verify flex-wrap container has correct className (Req 2.2)
- **Plant Card variant**: Verify each plant Card renders with `variant="compact"` (Req 2.3)
- **Responsive layout**: Verify responsive classes are applied to PlantRow (Req 2.5)
- **Zustand store structure**: Verify usePlants uses a Zustand store (Req 3.2)
- **isLoading during fetch**: Verify isLoading is true while fetching (Req 3.4)
- **IPlant gardenId field**: TypeScript compilation validates the type (Req 4.1)
- **Empty state message**: Verify "No plants yet" message renders when plants is empty (Req 5.1)
- **Empty state add action**: Verify add button renders in empty state (Req 5.2)
- **No empty state while loading**: Verify empty state is suppressed during loading (Req 5.3)

### Property-Based Tests

- **Property 1**: Heading card title reflects garden name (Req 1.1)
- **Property 2**: Plant count invariant (Req 2.1)
- **Property 3**: Plant card title reflects plant name (Req 2.4)
- **Property 4**: Garden ID filtering returns only matching plants (Req 3.1, 4.2)
- **Property 5**: Cache round-trip for offline access (Req 3.3, 3.6)
- **Property 6**: Error state propagation (Req 3.5)

Each property test runs a minimum of 100 iterations with generated inputs.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Heading card title reflects garden name

*For any* valid garden object with a non-empty name, when the GardenDetailScreen renders with that garden's ID, the Heading_Card title prop shall equal the garden's `name` field.

**Validates: Requirements 1.1**

### Property 2: Plant count invariant

*For any* array of N plants associated with a given gardenId (where N > 0), the PlantRow shall render exactly N Plant_Card components.

**Validates: Requirements 2.1**

### Property 3: Plant card title reflects plant name

*For any* plant object with a name field, the corresponding Plant_Card rendered in the PlantRow shall have its title prop equal to that plant's `name` field.

**Validates: Requirements 2.4**

### Property 4: Garden ID filtering returns only matching plants

*For any* collection of plants with various gardenId values, calling `usePlants(targetId)` shall return only plants whose `gardenId` field equals `targetId`, and no others.

**Validates: Requirements 3.1, 4.2**

### Property 5: Cache round-trip for offline access

*For any* array of plants previously fetched and cached for a given gardenId, when the device is offline, `usePlants(gardenId)` shall return the same array from MMKV cache without data loss or mutation.

**Validates: Requirements 3.3, 3.6**

### Property 6: Error state propagation

*For any* error thrown during the plant fetch operation, the `usePlants` hook's `error` state shall contain an Error object with details about the failure, and the `plants` array shall remain unchanged from its previous state (or served from cache).

**Validates: Requirements 3.5**
