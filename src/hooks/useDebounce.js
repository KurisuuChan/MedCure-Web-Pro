import { useState, useEffect } from 'react';

/**
 * Debounce hook to delay expensive operations
 * 
 * This hook prevents excessive re-renders and API calls by delaying
 * the update of a value until after a specified delay period has passed
 * without any new changes.
 * 
 * Perfect for:
 * - Search inputs
 * - Filter operations
 * - Form validation
 * - API calls triggered by user input
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value
 * 
 * @example
 * ```jsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This only runs 500ms after the user stops typing
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    // This prevents the debounced value from updating too frequently
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
