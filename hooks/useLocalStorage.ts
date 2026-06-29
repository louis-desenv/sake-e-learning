/**
 * useLocalStorage Hook
 *
 * Custom React hook for synchronizing state with localStorage.
 * Provides automatic persistence and cross-tab synchronization.
 *
 * @fileoverview This hook manages state that persists across page reloads and
 * browser sessions by syncing with localStorage. It handles JSON serialization,
 * error recovery, and cross-tab updates.
 *
 * @dependencies react
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// Fix: Import React to make the React namespace available for type annotations.
import React, { useState, useEffect } from 'react';

// ============================================================================
// HOOK DEFINITION
// ============================================================================

/**
 * Custom hook for syncing state with localStorage.
 *
 * @template T - The type of value to store
 * @param {string} key - The localStorage key to use for storage
 * @param {T} initialValue - The initial value to use if no stored value exists
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} A tuple containing
 * the stored value and a function to update it
 *
 * @example
 * ```tsx
 * const [user, setUser] = useLocalStorage<UserProfile>('userProfile', {
 *   name: '',
 *   level: EnglishLevel.BEGINNER,
 *   goals: [],
 *   interests: '',
 *   nativeLanguage: 'Portuguese'
 * });
 *
 * // Updates are automatically persisted to localStorage
 * setUser({ ...user, name: 'John' });
 * ```
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  /**
   * Initialize state from localStorage or use initialValue.
   * Runs once on component mount.
   */
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Updates both state and localStorage.
   * Handles both direct values and updater functions.
   *
   * @param {T | ((val: T) => T)} value - New value or updater function
   */
  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prevValue) => {
          // Resolve the value (handles both direct values and functions)
          const valueToStore = value instanceof Function ? value(prevValue) : value;
          // Persist to localStorage
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  /**
   * Synchronizes state when localStorage changes in other tabs.
   * Enables cross-tab communication for shared state.
   */
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error syncing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;