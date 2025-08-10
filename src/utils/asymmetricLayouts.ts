 /**
 * This utility provides the core engine for generating asymmetric layouts.
 * It defines various layout patterns and includes a function to generate
 * the necessary Tailwind CSS classes based on a given pattern and row index.
 */

interface AsymmetricRowConfig {
  split: 'small-large' | 'large-small';
  smallRatio: number;
  largeRatio: number;
}

export interface AsymmetricPattern {
  name: string;
  description: string;
  rows: AsymmetricRowConfig[];
}

/**
 * A centralized dictionary of all available asymmetric layout patterns.
 * This object makes the system easily extensible. To add a new rhythm,
 * simply add a new entry here.
 */
export const ASYMMETRIC_PATTERNS: Record<string, AsymmetricPattern> = {
  'asymmetric-standard': {
    name: 'Standard Alternating Asymmetric',
    description: 'Alternating 1/3 + 2/3 and 2/3 + 1/3 pattern.',
    rows: [
      { split: 'small-large', smallRatio: 33.333, largeRatio: 66.667 },
      { split: 'large-small', smallRatio: 33.333, largeRatio: 66.667 },
    ],
  },
  'asymmetric-progressive': {
    name: 'Progressive Asymmetric',
    description: 'A progressive 2+2 pattern: (S-L, S-L) then (L-S, L-S).',
    rows: [
      { split: 'small-large', smallRatio: 33.333, largeRatio: 66.667 },
      { split: 'small-large', smallRatio: 33.333, largeRatio: 66.667 },
      { split: 'large-small', smallRatio: 33.333, largeRatio: 66.667 },
      { split: 'large-small', smallRatio: 33.333, largeRatio: 66.667 },
    ],
  },
  'asymmetric-none': {
    name: 'Static Asymmetric',
    description: 'A static pattern where all rows are the same (e.g., S-L).',
    rows: [{ split: 'small-large', smallRatio: 33.333, largeRatio: 66.667 }],
  },
};

/**
 * Generates responsive Flexbox classes for an asymmetric row.
 * @param pattern - The layout pattern configuration.
 * @param rowIndex - The index of the current row to apply styles from the pattern.
 * @returns A string of Tailwind CSS classes.
 */
export function generateAsymmetricClasses(pattern: AsymmetricPattern, rowIndex: number, gapClass: string): string {
  const rowConfig = pattern.rows[rowIndex % pattern.rows.length];

  if (rowConfig.split === 'small-large') {
    return `flex flex-col md:flex-row ${gapClass} [&>*:first-child]:md:w-1/3 [&>*:last-child]:md:w-2/3 [&>*]:w-full`;
  } else if (rowConfig.split === 'large-small') {
    return `flex flex-col md:flex-row-reverse ${gapClass} [&>*:first-child]:md:w-2/3 [&>*:last-child]:md:w-1/3 [&>*]:w-full`;
  }

  return `flex flex-col ${gapClass} [&>*]:w-full`;
}
