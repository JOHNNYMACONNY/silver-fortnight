/**
 * Firestore utility functions
 * 
 * Helper functions for working with Firestore data
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Recursively removes undefined values from an object for Firestore compatibility.
 * 
 * Firestore doesn't support undefined values - they must be null or omitted.
 * This function deep-cleans objects to ensure all undefined values are removed
 * while preserving null values, Firestore Timestamps, and nested structures.
 * 
 * @param obj - The object to clean
 * @returns A new object with all undefined values removed recursively
 * 
 * @example
 * const data = {
 *   name: "John",
 *   email: undefined,
 *   createdAt: Timestamp.now(),
 *   metadata: {
 *     age: 30,
 *     city: undefined
 *   }
 * };
 * const cleaned = removeUndefinedDeep(data);
 * // Result: { name: "John", createdAt: Timestamp(...), metadata: { age: 30 } }
 */
export function removeUndefinedDeep<T extends Record<string, any>>(obj: T): T {
  const clean = (value: any): any => {
    // Explicitly return undefined - it will be filtered out by parent
    if (value === undefined) return undefined;
    
    // Preserve null values (Firestore accepts null)
    if (value === null) return null;
    
    // Preserve Firestore Timestamp objects (they have toDate method)
    if (value instanceof Timestamp) return value;
    
    // Preserve Date objects
    if (value instanceof Date) return value;
    
    // Handle arrays - recursively clean each item
    if (Array.isArray(value)) {
      return value.map(item => clean(item)).filter(item => item !== undefined);
    }
    
    // Handle objects - recursively clean nested properties
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        const cleaned = clean(val);
        // Only include the property if the cleaned value is not undefined
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }
      return result;
    }
    
    // Return primitive values as-is
    return value;
  };

  return clean(obj) as T;
}

