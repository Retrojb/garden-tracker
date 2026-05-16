import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using tailwind-merge for deduplication.
 * Consumer classes take precedence over default classes.
 */
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return twMerge(classes.filter(Boolean).join(' '));
};

export { cn };
