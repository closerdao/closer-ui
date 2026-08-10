import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update debounced value after delay
    timeoutRef.current = setTimeout(() => {
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setDebouncedValue(value);
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isMountedRef.current = false;
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}
