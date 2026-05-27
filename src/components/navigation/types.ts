
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
    ExpandedSectionsState, IAnimatedSubItemListProps, IChevronToggleProps, IDrawerParentItemProps, IDrawerSubItemProps, IExpandableDrawerSectionProps
};

