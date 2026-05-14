# Design Document: Card Variants

## Overview

This design introduces a `variant` prop to the existing `Card` component that controls which content slots are rendered and the visual density (padding, min-height) applied. The implementation leverages the existing `tailwind-variants` slot-based API by adding a `variants` configuration to the current `tv()` call. The `basic` variant preserves current behavior, making this a non-breaking change.

## Architecture

The feature is contained entirely within the Card component and its associated type file. No new components or modules are introduced.

```
src/
├── components/
│   └── Card.tsx          ← Updated: add variant logic to tv() config + conditional rendering
└── types/
    └── TCard.ts          ← New: extracted ICardProps type with variant union
```

### Data Flow

1. Consumer passes `variant` prop (or omits it for default `basic`)
2. `tailwind-variants` resolves the slot classes based on the active variant
3. Component conditionally renders content slots based on the variant value
4. `className` prop is merged into the base slot regardless of variant

## Components and Interfaces

### Card Component (`src/components/Card.tsx`)

The Card component is updated to:
- Accept a `variant` prop with type `'compact' | 'basic' | 'detailed'`
- Default to `'basic'` when the prop is omitted or invalid
- Conditionally render subtitle and children based on the active variant
- Apply variant-specific padding and min-height via `tailwind-variants`

```typescript
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'
import { ICardProps, CardVariant } from '@/src/types/TCard'

const VALID_VARIANTS: CardVariant[] = ['compact', 'basic', 'detailed']

const cardStyle = tv({
  slots: {
    base: 'flex-1 m-2 rounded-2xl bg-slate-300 border-4 border-indigo-200 border-t-indigo-500 outline-solid outline-offset-2 border-b-indigo-300',
    header: 'flex flex-col pb-2 border-b border-gray-100',
    title: 'text-base font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-500 mt-0.5',
    body: 'mt-2',
  },
  variants: {
    variant: {
      compact: {
        base: 'p-2',
      },
      basic: {
        base: 'p-4 min-h-[200px]',
      },
      detailed: {
        base: 'p-6 min-h-[280px]',
      },
    },
  },
  defaultVariants: {
    variant: 'basic',
  },
})

const resolveVariant = (variant?: string): CardVariant => {
  if (variant && VALID_VARIANTS.includes(variant as CardVariant)) {
    return variant as CardVariant
  }
  return 'basic'
}

const Card = ({ title, subtitle, children, onPress, className, variant }: ICardProps) => {
  const resolvedVariant = resolveVariant(variant)

  const {
    base,
    header,
    title: titleCls,
    subtitle: subtitleCls,
    body,
  } = cardStyle({ variant: resolvedVariant })

  const showSubtitle = resolvedVariant !== 'compact'
  const showChildren = resolvedVariant === 'detailed'

  const content = (
    <View className={base({ className })}>
      {(title || (subtitle && showSubtitle)) && (
        <View className={header()}>
          {title && (
            <Text className={titleCls()} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && showSubtitle && (
            <Text className={subtitleCls()} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children && showChildren && <View className={body()}>{children}</View>}
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

export { Card }
```

### Type File (`src/types/TCard.ts`)

```typescript
import { ReactNode } from 'react'

type CardVariant = 'compact' | 'basic' | 'detailed'

type ICardProps = {
  title?: string
  subtitle?: string
  children?: ReactNode
  /** When provided the entire card becomes pressable */
  onPress?: () => void
  /** Consumer-level style overrides merged into the base slot */
  className?: string
  /** Controls content slots and visual density. Defaults to 'basic'. */
  variant?: CardVariant
}

export type { ICardProps, CardVariant }
```

## Data Models

No new data models are introduced. The feature operates purely on component props.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `variant` prop omitted | Defaults to `'basic'` via `defaultVariants` and `resolveVariant` |
| `variant` prop receives invalid string at runtime | `resolveVariant` returns `'basic'` |
| `title` is undefined | Header section is conditionally hidden (existing behavior preserved) |
| `subtitle` is undefined with `basic`/`detailed` | Subtitle text is not rendered (existing behavior preserved) |
| `children` is undefined with `detailed` | Body section is not rendered (existing behavior preserved) |

## Visual Density Mapping

| Variant | Padding | Min-Height |
|---------|---------|------------|
| `compact` | `p-2` | none |
| `basic` | `p-4` | `min-h-[200px]` |
| `detailed` | `p-6` | `min-h-[280px]` |

## Testing Strategy

### Unit Tests (Example-Based)

- **Default variant**: Verify Card without `variant` prop renders with `basic` behavior (title + subtitle visible, children hidden, `p-4 min-h-[200px]` applied)
- **Visual density classes**: Verify each variant applies the correct padding and min-height classes (`compact` → `p-2`, no min-h; `basic` → `p-4 min-h-[200px]`; `detailed` → `p-6 min-h-[280px]`)
- **Backward compatibility**: Render Card with all existing props (title, subtitle, children, onPress, className) and no variant — verify no errors and basic behavior
- **Type export**: Verify `ICardProps` and `CardVariant` are exported from `src/types/TCard.ts`

### Property-Based Tests

- **Content slot visibility**: For random props and each variant, verify the correct slots are rendered/omitted
- **Invalid variant fallback**: For random non-valid strings, verify basic behavior
- **className passthrough**: For any variant and className, verify className appears in output

### Test Framework

- **Runner**: Jest via `jest-expo`
- **Rendering**: `@testing-library/react-native`
- **Property generation**: `fast-check` (already installed)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Variant controls content slot visibility

*For any* valid Card props (title, subtitle, children) and *for any* variant value in `['compact', 'basic', 'detailed']`:
- If variant is `compact`, the rendered output contains only the title (subtitle and children are absent)
- If variant is `basic`, the rendered output contains the title and subtitle (children are absent)
- If variant is `detailed`, the rendered output contains the title, subtitle, and children

**Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1**

### Property 2: Invalid variant falls back to basic

*For any* string value that is not one of `'compact'`, `'basic'`, or `'detailed'`, the Card SHALL render with the same content slot visibility and visual density as the `basic` variant.

**Validates: Requirements 1.3**

### Property 3: className is applied regardless of variant

*For any* variant value in `['compact', 'basic', 'detailed']` and *for any* non-empty className string, the rendered base container SHALL include the provided className in its class list.

**Validates: Requirements 10.2**
