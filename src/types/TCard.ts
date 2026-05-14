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

export type { CardVariant, ICardProps }

