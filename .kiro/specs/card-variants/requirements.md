# Requirements Document

## Introduction

The Card component currently renders a single layout with title, subtitle, and children. This feature introduces three distinct variants — `compact`, `basic`, and `detailed` — that control which content slots are rendered and how visual density (padding, min-height) scales per variant. The `basic` variant preserves the current behavior so existing usages remain unaffected.

## Glossary

- **Card**: The reusable UI component located at `src/components/Card.tsx` that displays content in a styled container with optional press behavior.
- **Variant**: A named configuration (`compact`, `basic`, or `detailed`) that determines which content slots the Card renders and the visual density applied.
- **Compact Variant**: A Card variant that renders only the title with reduced padding and no min-height constraint.
- **Basic Variant**: A Card variant that renders the title and subtitle, preserving the current padding and min-height.
- **Detailed Variant**: A Card variant that renders the title, subtitle, and children with increased padding and a larger min-height.
- **Visual Density**: The combination of padding and min-height values applied to the Card container based on the active variant.

## Requirements

### Requirement 1: Variant Prop

**User Story:** As a developer, I want to pass a `variant` prop to the Card component, so that I can control the content and visual density without creating separate components.

#### Acceptance Criteria

1. THE Card SHALL accept a `variant` prop with allowed values of `compact`, `basic`, or `detailed`.
2. WHEN no `variant` prop is provided, THE Card SHALL default to the `basic` variant.
3. IF an invalid value is provided for the `variant` prop, THEN THE Card SHALL fall back to the `basic` variant behavior.

### Requirement 2: Compact Variant Content

**User Story:** As a developer, I want the compact variant to render only the title, so that I can use a minimal card in space-constrained layouts.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `compact`, THE Card SHALL render only the title text.
2. WHEN the `variant` prop is set to `compact`, THE Card SHALL omit the subtitle from the rendered output.
3. WHEN the `variant` prop is set to `compact`, THE Card SHALL omit children from the rendered output.

### Requirement 3: Basic Variant Content

**User Story:** As a developer, I want the basic variant to render the title and subtitle, so that existing Card usages continue working without changes.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `basic`, THE Card SHALL render the title and subtitle.
2. WHEN the `variant` prop is set to `basic`, THE Card SHALL omit children from the rendered output.

### Requirement 4: Detailed Variant Content

**User Story:** As a developer, I want the detailed variant to render title, subtitle, and children, so that I can display rich content within the card.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `detailed`, THE Card SHALL render the title, subtitle, and children.

### Requirement 5: Visual Density — Compact

**User Story:** As a developer, I want the compact variant to have tighter visual density, so that it takes up less vertical space in constrained layouts.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `compact`, THE Card SHALL apply reduced padding compared to the `basic` variant.
2. WHEN the `variant` prop is set to `compact`, THE Card SHALL apply no min-height constraint to the container.

### Requirement 6: Visual Density — Basic

**User Story:** As a developer, I want the basic variant to preserve the current visual density, so that existing usages remain visually unchanged.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `basic`, THE Card SHALL apply the current padding value.
2. WHEN the `variant` prop is set to `basic`, THE Card SHALL apply the current min-height value of 200px.

### Requirement 7: Visual Density — Detailed

**User Story:** As a developer, I want the detailed variant to have more generous spacing, so that rich content has room to breathe.

#### Acceptance Criteria

1. WHEN the `variant` prop is set to `detailed`, THE Card SHALL apply increased padding compared to the `basic` variant.
2. WHEN the `variant` prop is set to `detailed`, THE Card SHALL apply a larger min-height than the `basic` variant.

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want existing Card usages to continue working without modification, so that the variant feature is non-breaking.

#### Acceptance Criteria

1. THE Card SHALL maintain the existing props interface (title, subtitle, children, onPress, className) alongside the new `variant` prop.
2. WHEN existing consumers (PlantCarousel, GardenCarousel, plants page) render the Card without a `variant` prop, THE Card SHALL render with `basic` variant behavior.

### Requirement 9: Type Safety

**User Story:** As a developer, I want the variant prop to be type-safe, so that invalid values are caught at compile time.

#### Acceptance Criteria

1. THE Card SHALL export a TypeScript type that constrains the `variant` prop to the literal union `'compact' | 'basic' | 'detailed'`.
2. THE Card SHALL extract its props type to the project types directory following the existing convention.

### Requirement 10: Styling Integration

**User Story:** As a developer, I want the variant styles to integrate with the existing `tailwind-variants` setup, so that the implementation is consistent with project conventions.

#### Acceptance Criteria

1. THE Card SHALL implement variant-based styling using the `tailwind-variants` (`tv`) slot-based API with a `variants` configuration.
2. THE Card SHALL continue to accept a `className` prop for consumer-level style overrides regardless of the active variant.
