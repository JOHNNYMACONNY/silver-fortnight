import clsx from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that merges multiple class names together and resolves Tailwind CSS conflicts.
 * Uses clsx for conditional class names and tailwind-merge to handle Tailwind CSS conflicts.
 * 
 * @param inputs - Class names to merge
 * @returns Merged class names string
 * 
 * @example
 * // Returns "p-4 bg-blue-500" (not "p-2 p-4 bg-red-500 bg-blue-500")
 * cn("p-2 bg-red-500", "p-4 bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
